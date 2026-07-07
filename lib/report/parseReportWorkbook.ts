import * as XLSX from "xlsx"
import type { ActivityRow, ActivityType, ProgressRow } from "@/types/report"

type Cell = string | number | Date | null | undefined

const BASE_COLUMNS = ["WBS", "Activities", "Amount", "P/A", "%Progress"]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function normalizeDate(value: Cell) {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value)
    return `${parsed.y}-${pad(parsed.m)}-${pad(parsed.d)}`
  }

  const clean = String(value ?? "").trim()
  if (!clean) return ""

  if (clean.includes("-")) {
    const [y, m, d] = clean.split("-")
    return `${y}-${pad(Number(m))}-${pad(Number(d))}`
  }

  if (clean.includes("/")) {
    const [d, m, y] = clean.split("/")
    return `${y.length === 2 ? `20${y}` : y}-${pad(Number(m))}-${pad(Number(d))}`
  }

  return clean
}

function toNumber(value: Cell) {
  if (typeof value === "number") return value

  return (
    Number(
      String(value ?? "")
        .replaceAll(",", "")
        .replace("%", "")
        .trim()
    ) || 0
  )
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) return []

  return XLSX.utils.sheet_to_json<Cell[]>(sheet, {
    header: 1,
    raw: true,
    defval: "",
  })
}

function parseProgressSheet(workbook: XLSX.WorkBook): ProgressRow[] {
  const rows = sheetRows(workbook, "progress")
  const headers = rows[0].map((h) => String(h).trim())

  return rows
    .slice(1)
    .map((r) => {
      const row = Object.fromEntries(headers.map((h, i) => [h, r[i]]))

      return {
        project_start: normalizeDate(row.project_start),
        project_finish: normalizeDate(row.project_finish),
        week_start: normalizeDate(row.week_start),
        plan: toNumber(row.plan),
        actual: toNumber(row.actual),
      }
    })
    .filter((r) => r.week_start)
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
}

function parseActivitySheet(workbook: XLSX.WorkBook): ActivityRow[] {
  const rows = sheetRows(workbook, "progress_table")
  const headerRow = rows[0]

  const headers = headerRow.map((h) => String(h).trim())

  const weekIndexes = headerRow
    .map((header, index) => ({
      rawHeader: header,
      label: String(header).trim(),
      index,
    }))
    .filter((item) => !BASE_COLUMNS.includes(item.label))

  return rows
    .slice(1)
    .map((r) => {
      const row = Object.fromEntries(headers.map((h, i) => [h, r[i]]))
      const amount = toNumber(row.Amount)

      return {
        wbs: String(row.WBS ?? ""),
        activity: String(row.Activities ?? ""),
        amount,
        type: String(row["P/A"] ?? "P") as ActivityType,
        originalProgress: toNumber(row["%Progress"]),
        weeks: weekIndexes
          .map(({ rawHeader, index }) => ({
            date: normalizeDate(rawHeader),
            value: toNumber(r[index]),
          }))
          .filter((week) => week.date),
      }
    })
    .filter((row) => row.amount > 0)
}

export function parseReportWorkbook(arrayBuffer: ArrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: true,
  })

  return {
    progressRows: parseProgressSheet(workbook),
    activityRows: parseActivitySheet(workbook),
  }
}