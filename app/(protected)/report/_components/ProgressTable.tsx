import type { ActivityTableRow } from "@/types/report";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatProgress(value: number) {
  if (Number.isInteger(value)) {
    return `${value.toFixed(0)}%`;
  }

  return `${value.toFixed(1)}%`;
}

export function ActivityTable({ data }: { data: ActivityTableRow[] }) {
  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card-lg">
      <div className="border-b border-border p-5">
        <h2 className="text-xl font-bold">Activity Progress</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Progress and amount are calculated from weekly values up to the
          selected cutoff date.
        </p>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-2 text-muted-foreground">
            <tr>
              <th className="px-5 py-4">WBS</th>

              <th className="px-5 py-4">Activity</th>

              <th className="px-5 py-4">Type</th>

              <th className="px-5 py-4 text-right">Total</th>

              <th className="px-5 py-4 text-right">Amount</th>

              <th className="px-5 py-4">Progress</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const previous = data[index - 1];

              const isDuplicateActivity =
                Boolean(previous) &&
                previous.wbs === row.wbs &&
                previous.activity === row.activity;

              const isPlan = row.type === "P";

              const progressBarWidth = Math.min(Math.max(row.progress, 0), 100);

              return (
                <tr
                  key={`${row.wbs}-${row.type}-${index}`}
                  className="border-t border-border"
                >
                  <td className="px-5 py-4 font-semibold">
                    {isDuplicateActivity ? "" : row.wbs}
                  </td>

                  <td className="max-w-[420px] px-5 py-4">
                    {!isDuplicateActivity && (
                      <div className="line-clamp-2 font-medium">
                        {row.activity}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className={isDuplicateActivity ? "ml-4" : ""}>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          isPlan
                            ? "bg-blue-500/15 text-accent"
                            : "bg-emerald-500/15 text-success",
                        ].join(" ")}
                      >
                        {isPlan ? "Plan" : "Actual"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right tabular-nums">
                    {isPlan ? formatMoney(row.total) : ""}
                  </td>

                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatMoney(row.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex min-w-[220px] items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className={[
                            "h-full rounded-full",
                            isPlan ? "bg-blue-500" : "bg-emerald-500",
                          ].join(" ")}
                          style={{
                            width: `${progressBarWidth}%`,
                            minWidth: row.progress > 0 ? "3px" : "0",
                          }}
                        />
                      </div>

                      <span
                        className={[
                          "w-16 text-right font-semibold tabular-nums",
                          isPlan ? "text-accent" : "text-success",
                        ].join(" ")}
                      >
                        {formatProgress(row.progress)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
