import type { ActivityRow, ActivityTableRow } from "@/types/report"

export function calculateActivityProgress(
  rows: ActivityRow[],
  cutoffDate: string
): ActivityTableRow[] {
  if (!cutoffDate) return []

  return rows.map((row) => {
    const progress = row.weeks
      .filter((week) => week.date <= cutoffDate)
      .reduce((sum, week) => sum + week.value, 0)

    const total = row.amount
    const amount = total * (progress / 100)

    return {
      wbs: row.wbs,
      activity: row.activity,
      type: row.type,
      total,
      amount,
      progress,
    }
  })
}