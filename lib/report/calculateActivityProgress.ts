import type { ActivityRow, ActivityTableRow } from "@/types/report"

export function calculateActivityProgress(
  rows: ActivityRow[],
  cutoffDate: string
): ActivityTableRow[] {
  if (!cutoffDate) return []

  return rows.map((row) => {
    const weeks = row.weeks.filter((week) => week.date <= cutoffDate)
    const progress = !weeks.length || weeks.some(week => week.value === null)
      ? null : weeks.reduce((sum, week) => sum + (week.value ?? 0), 0)

    const total = row.amount
    const amount = progress === null ? null : total * (progress / 100)

    return {
      kind: row.kind,
      wbs: row.wbs,
      activity: row.activity,
      type: row.type,
      total,
      amount,
      progress,
    }
  })
}
