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
  unique_propositions: number | null;
  repetition_count: number | null;
  speech_tempo_wpm?: number | null;
}

const SCORE_SERIES = [
  { key: "vocabulary_richness", name: "Word variety", color: "var(--color-chart-1)" },
  { key: "sentence_complexity", name: "Sentence structure", color: "var(--color-chart-2)" },
] as const;

const COUNT_SERIES = [
  { key: "unique_propositions", name: "Idea density", color: "var(--color-chart-3)" },
  { key: "repetition_count", name: "Semantic repetition", color: "var(--color-chart-4)" },
] as const;

const TEMPO_SERIES = [
  { key: "speech_tempo_wpm", name: "Speech tempo (wpm)", color: "var(--color-chart-5)" },
] as const;


function formatDay(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.75rem",
  color: "var(--color-popover-foreground)",
  fontSize: "0.8rem",
} as const;

function Legend({ series }: { series: ReadonlyArray<{ key: string; name: string; color: string }> }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: s.color }}
            aria-hidden
          />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

export function TrendChart({ points }: { points: TrendPoint[] }) {
  const data = [...points]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((point) => ({ ...point, day: formatDay(point.created_at) }));

  const hasCounts = data.some(
    (d) => d.unique_propositions !== null || d.repetition_count !== null,
  );

  const hasTempo = data.some((d) => d.speech_tempo_wpm !== null && d.speech_tempo_wpm !== undefined);


  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Measured in code from your writing — scored 0 to 100.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              {SCORE_SERIES.map((series) => (
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
        <Legend series={SCORE_SERIES} />
      </div>

      {hasCounts && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Extracted per entry by the Featherless language model — counts of distinct ideas and
            ideas repeated within the same entry.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis
                  allowDecimals={false}
                  stroke="var(--color-muted-foreground)"
                  fontSize={12}
                />
                <Tooltip contentStyle={tooltipStyle} />
                {COUNT_SERIES.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend series={COUNT_SERIES} />
        </div>
      )}

      {hasTempo && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Measured in your browser while dictating — words spoken per minute. Typed entries don't
            appear here.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis allowDecimals={false} stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                {TEMPO_SERIES.map((series) => (
                  <Line
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend series={TEMPO_SERIES} />
        </div>
      )}
    </div>

  );
}
