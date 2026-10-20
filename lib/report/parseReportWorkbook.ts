import * as XLSX from "xlsx"
import type { ActivityRow, ActivityType, ProgressRow } from "@/types/report"

const BASE = ["WBS", "Activities", "Amount", "P/A", "%Progress"]
const REQUIRED = ["project_start", "project_finish", "week_start", "plan", "actual"]
const RECALCULATE = "Open in desktop Excel, set Calculation to Automatic, calculate the workbook, then Save, Close and reopen before uploading. OKD cannot calculate Excel formulas."
const text = (v: unknown) => String(v ?? "").trim()

function date(value: unknown, date1904: boolean): string {
  let y: number, m: number, d: number
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const p = XLSX.SSF.parse_date_code(Math.floor(value), { date1904 })
    if (!p) return ""
    ;({ y, m, d } = p)
  } else {
    const s = text(value)
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
    const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
    if (iso) [y, m, d] = iso.slice(1).map(Number)
    else if (local) [d, m, y] = local.slice(1).map(Number)
    else return ""
  }
  const check = new Date(Date.UTC(y, m - 1, d))
  if (y < 1900 || y > 9999 || check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) return ""
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}

function number(v: unknown, location: string, optional = false): number | null {
  if (v == null || text(v) === "") {
    if (optional) return null
    throw new Error(`${location}: missing numeric value. ${RECALCULATE}`)
  }
  const n = typeof v === "number" ? v : Number(text(v).replaceAll(",", "").replace(/%$/, ""))
  if (typeof v === "boolean" || !Number.isFinite(n)) throw new Error(`${location}: invalid number.`)
  return n
}

function percent(v: unknown, location: string, optional = false) {
  const n = number(v, location, optional)
  if (n !== null && (n < -0.0001 || n > 100.0001)) throw new Error(`${location}: expected percentage on the 0–100 scale.`)
  return n
}

function readSheet(w: XLSX.WorkBook, name: string, required: string[]) {
  const s = w.Sheets[name]
  if (!s?.["!ref"]) throw new Error(`Missing or empty required sheet: ${name}. Upload the Progress Studio export workbook.`)
  const range = XLSX.utils.decode_range(s["!ref"])
  if (range.e.r > 20000 || range.e.c > 520) throw new Error(`${name}: exceeds supported report size (20,000 rows / 521 columns).`)
  for (const [address, cell] of Object.entries(s)) {
    if (address.startsWith("!")) continue
    if (cell.f && (cell.t === "z" || cell.v === undefined)) throw new Error(`${name}!${address}: formula has no saved result. ${RECALCULATE}`)
    if (cell.t === "e") throw new Error(`${name}!${address}: Excel error. Correct the source and recalculate before uploading.`)
  }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(s, { header: 1, raw: true, defval: null })
  const headers = (rows[0] ?? []).map(text)
  for (const h of required) if (headers.filter(x => x === h).length !== 1) throw new Error(`${name}: requires exactly one ${h} column.`)
  return { rows: rows.slice(1).filter(r => r.some(v => v != null && text(v) !== "")), headers }
}

export function parseReportWorkbook(arrayBuffer: ArrayBuffer) {
  if (arrayBuffer.byteLength > 20 * 1024 * 1024) throw new Error("Report workbook exceeds the 20 MiB upload limit.")
  let w: XLSX.WorkBook
  try { w = XLSX.read(arrayBuffer, { type: "array", cellDates: false, sheetStubs: true }) }
  catch { throw new Error("Cannot read this Excel workbook. Upload a valid .xlsx Progress Studio export.") }
  const date1904 = Boolean(w.Workbook?.WBProps?.date1904)
  const live = readSheet(w, "progress", REQUIRED)
  const seen = new Set<string>()
  const progressRows: ProgressRow[] = live.rows.map((r, i) => {
    const get = (h: string) => r[live.headers.indexOf(h)]
    const dates = REQUIRED.slice(0, 3).map(h => date(get(h), date1904))
    if (dates.some(d => !d) || dates[1] < dates[0]) throw new Error(`progress row ${i + 2}: invalid project or weekly date. ${RECALCULATE}`)
    if (seen.has(dates[2])) throw new Error(`progress: duplicate week ${dates[2]}.`)
    seen.add(dates[2])
    return { project_start: dates[0], project_finish: dates[1], week_start: dates[2], plan: percent(get("plan"), `progress row ${i + 2} Plan`)!, actual: percent(get("actual"), `progress row ${i + 2} Actual`, true) }
  }).sort((a, b) => a.week_start.localeCompare(b.week_start))
  if (!progressRows.length) throw new Error(`progress contains no usable weekly data. ${RECALCULATE}`)
  if (progressRows.some(r => r.project_start !== progressRows[0].project_start || r.project_finish !== progressRows[0].project_finish)) throw new Error("progress: inconsistent project dates.")

  const snapshot = readSheet(w, "progress_table", BASE)
  const rawHeaders = XLSX.utils.sheet_to_json<unknown[]>(w.Sheets.progress_table, { header: 1, raw: true })[0]
  const weeks = rawHeaders.flatMap((h, index) => {
    if (BASE.includes(text(h)) || text(h) === "_Kind" || !text(h)) return []
    const d = date(h, date1904)
    if (!d) throw new Error(`progress_table: unsupported column ${text(h)}; expected a weekly date or _Kind.`)
    return [{ date: d, index }]
  }).sort((a, b) => a.date.localeCompare(b.date))
  if (!weeks.length || new Set(weeks.map(w => w.date)).size !== weeks.length) throw new Error("progress_table: missing or duplicate weekly dates.")
  const pairs = new Map<string, ActivityRow[]>()
  const activityRows: ActivityRow[] = snapshot.rows.map((r, i) => {
    const get = (h: string) => r[snapshot.headers.indexOf(h)]
    const kind = snapshot.headers.includes("_Kind") ? text(get("_Kind")).toLowerCase() : "activity"
    if (!["project", "wbs", "activity"].includes(kind)) throw new Error(`progress_table row ${i + 2}: invalid _Kind.`)
    const type = text(get("P/A")) as ActivityType
    if (type !== "P" && type !== "A") throw new Error(`progress_table row ${i + 2}: P/A must be P or A.`)
    const amount = number(get("Amount"), `progress_table row ${i + 2} Amount`)!
    if (amount < 0 || !text(get("Activities"))) throw new Error(`progress_table row ${i + 2}: invalid Amount or Activities.`)
    const row: ActivityRow = { kind: kind as ActivityRow["kind"], wbs: text(get("WBS")), activity: text(get("Activities")), amount, type, originalProgress: percent(get("%Progress"), `progress_table row ${i + 2} %Progress`, true), weeks: weeks.map(week => ({ date: week.date, value: percent(r[week.index], `progress_table row ${i + 2} ${week.date}`, true) })) }
    let sum = 0
    for (const week of row.weeks) { sum += week.value ?? 0; if (sum > 100.0001) throw new Error(`progress_table row ${i + 2}: weekly increments exceed 100%.`) }
    const key = JSON.stringify([kind, row.wbs, row.activity])
    pairs.set(key, [...(pairs.get(key) ?? []), row])
    return row
  })
  if (!activityRows.length) throw new Error("progress_table contains no activity rows.")
  for (const pair of pairs.values()) if (pair.length !== 2 || pair[0].type === pair[1].type || pair[0].amount !== pair[1].amount) throw new Error("progress_table: ambiguous, missing or inconsistent P/A pair. Rebuild/export the Studio workbook.")
  const warnings = ["Activity table is a saved snapshot. After editing progress in Excel, rebuild/export in Studio to refresh the table, then recalculate and save in Excel. Matching totals alone do not prove every activity is current."]
  let snapshotUsable = weeks.map(w => w.date).join() === progressRows.map(r => r.week_start).join()
  const projects = activityRows.filter(r => r.kind === "project")
  if (projects.length && projects.length !== 2) throw new Error("progress_table: expected one project P/A pair.")
  for (const project of projects) {
    let cumulative = 0, available = true
    for (const week of project.weeks) {
      if (week.value === null) available = false
      else cumulative += week.value
      const liveRow = progressRows.find(r => r.week_start === week.date)
      const liveValue = project.type === "P" ? liveRow?.plan : liveRow?.actual
      if (available && liveValue != null && Math.abs(cumulative - liveValue) > 0.01) snapshotUsable = false
      if (!available && liveValue != null) snapshotUsable = false
    }
  }
  if (!snapshotUsable) warnings.unshift("Activity table withheld: snapshot dates or project totals differ from live progress. Rebuild/export in Studio, then recalculate and save in Excel.")
  const info = w.Sheets.Info ? XLSX.utils.sheet_to_json<unknown[]>(w.Sheets.Info, { header: 1, raw: true }) : []
  const placeholder = info.some(r => text(r[0]) === "Amount Initialization Source" && text(r[1]) === "manual_placeholder")
  const amountLabel = placeholder ? "Weight (placeholder)" : "Amount / weight (source units)"
  warnings.push(placeholder ? "Amounts are placeholder progress weights, not contract money." : "Amount basis is not certified as contract money; values retain source units. Project/WBS rollups must not be added to child rows.")
  return { progressRows, activityRows: snapshotUsable ? activityRows : [], warnings, amountLabel }
}
