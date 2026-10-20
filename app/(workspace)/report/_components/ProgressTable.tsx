import type { ActivityTableRow } from "@/types/report";

function formatMoney(value: number | null) {
  if (value === null) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatProgress(value: number) {
  if (Number.isInteger(value)) {
    return `${value.toFixed(0)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 100);
}

type ActivityGroup = {
  key: string;
  wbs: string;
  activity: string;
  total: number;
  plan?: ActivityTableRow;
  actual?: ActivityTableRow;
};

function groupActivities(data: ActivityTableRow[]): ActivityGroup[] {
  const groups = new Map<string, ActivityGroup>();

  data.forEach((row, index) => {
    const key = JSON.stringify([row.kind, row.wbs, row.activity]);
    const existing = groups.get(key);

    const group =
      existing ??
      ({
        key: `${key}::${index}`,
        wbs: row.wbs,
        activity: `${row.kind ?? "activity"}: ${row.activity}`,
        total: row.total,
      } satisfies ActivityGroup);

    if (row.type === "P") {
      group.plan = row;
      group.total = row.total;
    } else {
      group.actual = row;
    }

    if (!existing) groups.set(key, group);
  });

  return Array.from(groups.values());
}

function ProgressBar({
  value,
  tone,
}: {
  value: number | null;
  tone: "plan" | "actual";
}) {
  if (value === null) return <span>Unavailable</span>;
  const width = clampProgress(value);
  const isPlan = tone === "plan";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className={[
            "h-full rounded-full",
            isPlan ? "bg-blue-500" : "bg-emerald-500",
          ].join(" ")}
          style={{
            width: `${width}%`,
            minWidth: value > 0 ? "3px" : "0",
          }}
        />
      </div>

      <span
        className={[
          "w-14 text-right text-sm font-semibold tabular-nums",
          isPlan ? "text-accent" : "text-success",
        ].join(" ")}
      >
        {formatProgress(value)}
      </span>
    </div>
  );
}

function MobileProgressRow({
  label,
  row,
  tone,
}: {
  label: string;
  row?: ActivityTableRow;
  tone: "plan" | "actual";
}) {
  const isPlan = tone === "plan";
  const amount = row?.amount ?? null;
  const progress = row?.progress ?? null;

  return (
    <div className="rounded-2xl border border-border bg-surface-2/55 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-bold",
            isPlan
              ? "bg-blue-500/15 text-accent"
              : "bg-emerald-500/15 text-success",
          ].join(" ")}
        >
          {label}
        </span>

        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatMoney(amount)}
        </span>
      </div>

      <ProgressBar value={progress} tone={tone} />
    </div>
  );
}

export function ActivityTable({ data, amountLabel }: { data: ActivityTableRow[]; amountLabel: string }) {
  const activityGroups = groupActivities(data);

  return (
    <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-card-lg">
      <div className="border-b border-border p-5 sm:p-6">
        <h2 className="text-xl font-bold">Activity Progress</h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Snapshot: weekly increments summed through the selected cutoff.
          {" "}{amountLabel}. Project and WBS rows are rollups; do not add them to children.
        </p>
      </div>

      {/* Mobile: one activity per card */}
      <div className="space-y-4 p-4 md:hidden">
        {activityGroups.map((group) => (
          <article
            key={group.key}
            className="overflow-hidden rounded-2xl border border-border bg-background/45 shadow-sm"
          >
            <div className="border-b border-border p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {group.wbs}
                </span>

                <h3 className="min-w-0 text-base font-semibold leading-6 text-foreground">
                  {group.activity}
                </h3>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-surface-2/65 px-3 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Total {amountLabel}
                </span>
                <span className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
                  {formatMoney(group.total)}
                </span>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <MobileProgressRow label="Plan" row={group.plan} tone="plan" />
              <MobileProgressRow
                label="Actual"
                row={group.actual}
                tone="actual"
              />
            </div>
          </article>
        ))}
      </div>

      {/* Desktop/tablet: full table */}
      <div className="hidden max-h-[520px] overflow-auto md:block">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-2 text-muted-foreground">
            <tr>
              <th className="px-5 py-4">WBS</th>
              <th className="px-5 py-4">Activity</th>
              <th className="px-5 py-4">Type</th>
              <th className="px-5 py-4 text-right">Total {amountLabel}</th>
              <th className="px-5 py-4 text-right">Completed {amountLabel}</th>
              <th className="px-5 py-4">Progress</th>
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => {
              const previous = data[index - 1];

              const isDuplicateActivity =
                Boolean(previous) &&
                previous.wbs === row.wbs &&
                previous.kind === row.kind &&
                previous.activity === row.activity;

              const isPlan = row.type === "P";

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
                        {row.kind ?? "activity"}: {row.activity}
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
                    <div className="min-w-[220px]">
                      <ProgressBar
                        value={row.progress}
                        tone={isPlan ? "plan" : "actual"}
                      />
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
