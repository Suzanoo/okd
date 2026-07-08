"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartRow } from "@/types/report";

type TooltipPayload = {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
};

function formatPercent(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)}%`;
}

function CustomTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;

  const rows = payload.filter(
    (item) => typeof item.value === "number" && !Number.isNaN(item.value),
  );

  if (!rows.length) return null;

  return (
    <div className="min-w-[150px] rounded-2xl border border-border bg-surface/95 p-3 text-sm shadow-card-lg backdrop-blur-md">
      <div className="mb-2 font-bold text-foreground">{label}</div>
      <div className="space-y-1.5">
        {rows.map((item) => (
          <div
            key={`${item.dataKey}-${item.name}`}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-semibold tabular-nums text-foreground">
              {formatPercent(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SCurveChart({ data }: { data: ChartRow[] }) {
  return (
    <section className="mt-5 rounded-3xl border border-border bg-surface p-4 shadow-card-lg md:mt-6 md:p-6">
      <div className="mb-4 md:mb-5">
        <h2 className="text-lg font-bold md:text-xl">S-Curve</h2>
        <p className="text-sm text-muted-foreground">Plan vs Actual Progress</p>
      </div>

      <div className="h-[340px] sm:h-[380px] md:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.25)"
            />
            <XAxis
              dataKey="label"
              stroke="rgb(100,116,139)"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              minTickGap={22}
            />
            <YAxis
              stroke="rgb(100,116,139)"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              width={44}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "rgba(148,163,184,0.45)", strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ paddingTop: 12, fontSize: 13 }}
            />

            <Line
              type="monotone"
              dataKey="plan"
              name="Plan"
              stroke="#2563eb"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
            />

            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="#16a34a"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
