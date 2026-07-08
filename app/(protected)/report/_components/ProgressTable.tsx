import type { ActivityTableRow } from "@/types/report";

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

function progressColor(isPlan: boolean) {
  return isPlan ? "bg-blue-500" : "bg-emerald-500";
}

function badgeColor(isPlan: boolean) {
  return isPlan
    ? "bg-blue-500/15 text-accent"
    : "bg-emerald-500/15 text-success";
}

function progressTextColor(isPlan: boolean) {
  return isPlan ? "text-accent" : "text-success";
}

function ProgressBar({
  progress,
  isPlan,
}: {
  progress: number;
  isPlan: boolean;
}) {
  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${progressColor(isPlan)}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
      <span
        className={`w-14 text-right text-xs font-bold tabular-nums ${progressTextColor(
          isPlan,
        )}`}
      >
        {progress.toFixed(1)}%
      </span>
    </div>
  );
}

export function ActivityTable({ data }: { data: ActivityTableRow[] }) {
  return (
    <section className="mt-5 overflow-hidden rounded-3xl border border-border bg-surface shadow-card-lg md:mt-6">
      <div className="border-b border-border p-4 md:p-5">
        <h2 className="text-lg font-bold md:text-xl">Activity Progress</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Progress is calculated from weekly values up to selected cutoff date.
        </p>
      </div>

      <div className="md:hidden">
        <div className="max-h-[620px] space-y-3 overflow-auto p-3">
          {data.map((row, index) => {
            const isPlan = row.type === "P";

            return (
              <article
                key={`${row.wbs}-${row.type}-${index}-mobile`}
                className="rounded-2xl border border-border bg-background/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      WBS {row.wbs}
                    </div>
                    <div className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-foreground">
                      {row.activity}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${badgeColor(
                      isPlan,
                    )}`}
                  >
                    {isPlan ? "Plan" : "Actual"}
                  </span>
                </div>

                <div className="mt-4">
                  <ProgressBar progress={row.progress} isPlan={isPlan} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Amount</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatMoney(row.amount)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="hidden max-h-[520px] overflow-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-2 text-muted-foreground">
            <tr>
              <th className="px-5 py-4">WBS</th>
              <th className="px-5 py-4">Activity</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4 text-right">Amount</th>
              <th className="px-5 py-4">Progress</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const previous = data[index - 1];

              const isDuplicateActivity =
                previous &&
                previous.wbs === row.wbs &&
                previous.activity === row.activity;

              const isPlan = row.type === "P";

              return (
                <tr
                  key={`${row.wbs}-${row.type}-${index}`}
                  className="border-t border-border"
                >
                  <td className="px-5 py-4 font-medium">
                    {isDuplicateActivity ? "" : row.wbs}
                  </td>

                  <td className="max-w-[420px] px-5 py-4">
                    {!isDuplicateActivity && (
                      <div className="line-clamp-3 font-medium">
                        {row.activity}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className={isDuplicateActivity ? "ml-4" : ""}>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeColor(
                          isPlan,
                        )}`}
                      >
                        {isPlan ? "Plan" : "Actual"}
                      </span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right tabular-nums">
                    {formatMoney(row.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="min-w-[180px]">
                      <ProgressBar progress={row.progress} isPlan={isPlan} />
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
