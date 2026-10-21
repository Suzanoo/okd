import type { KpiResult } from "@/types/report";

function Card({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "good" | "bad" | "blue" | "green";
}) {
  const color =
    tone === "blue"
      ? "text-accent"
      : tone === "green"
        ? "text-success"
        : tone === "good"
          ? "text-success"
          : tone === "bad"
            ? "text-danger"
            : "text-foreground";

  return (
    <div className="rounded-3xl border border-border bg-surface p-4 shadow-card md:p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-xs md:tracking-[0.22em]">
        {title}
      </div>
      <div
        className={`mt-3 text-3xl font-black tabular-nums md:mt-4 md:text-4xl ${color}`}
      >
        {value}
      </div>
    </div>
  );
}

export function KPICards({ kpi }: { kpi: KpiResult | null }) {
  const isGood = (kpi?.variance ?? 0) >= 0;

  return (
    <section className="grid gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
      <Card
        title="Planned Progress"
        value={kpi ? `${kpi.plan.toFixed(2)}%` : "Unavailable"}
        tone="blue"
      />
      <Card
        title="Actual Progress"
        value={kpi ? `${kpi.actual.toFixed(2)}%` : "Unavailable"}
        tone="green"
      />
      <Card
        title="Progress Variance"
        value={kpi ? `${kpi.variance > 0 ? "+" : ""}${kpi.variance.toFixed(2)} pp` : "Unavailable"}
        tone={isGood ? "good" : "bad"}
      />
      <Card
        title="Duration proxy (not schedule delay)"
        value={kpi ? `${kpi.days > 0 ? "+" : ""}${kpi.days} days` : "Unavailable"}
        tone={isGood ? "good" : "bad"}
      />
    </section>
  );
}
