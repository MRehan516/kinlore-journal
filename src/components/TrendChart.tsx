import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface TrendPoint {
  created_at: string;
  vocabulary_richness: number;
  sentence_complexity: number;
  clarity: number;
  sentiment: number;
}

const SERIES = [
  { key: "vocabulary_richness", name: "Word variety", color: "var(--color-chart-1)" },
  { key: "sentence_complexity", name: "Sentence structure", color: "var(--color-chart-2)" },
  { key: "clarity", name: "Clarity", color: "var(--color-chart-3)" },
  { key: "sentiment", name: "Warmth of tone", color: "var(--color-chart-4)" },
] as const;

function formatDay(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const data = [...points]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((point) => ({ ...point, day: formatDay(point.created_at) }));

  return (
    <div className="space-y-3">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                color: "var(--color-popover-foreground)",
                fontSize: "0.8rem",
              }}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.name}
                stroke={series.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: series.color }}
              aria-hidden
            />
            {series.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
