import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface FootprintEntry {
  vocabulary_richness: number;
  sentence_complexity: number;
  unique_propositions: number | null;
  speech_tempo_wpm: number | null;
}

/** Reference ceilings used to put every axis on a comparable 0-100 scale. */
const IDEA_DENSITY_CEILING = 20; // distinct ideas in one entry
const TEMPO_CEILING = 180; // words per minute

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function axisValues(entries: FootprintEntry[]) {
  if (entries.length === 0) return null;
  const avg = (pick: (e: FootprintEntry) => number | null) => {
    const values = entries.map(pick).filter((v): v is number => v !== null && !Number.isNaN(v));
    if (values.length === 0) return null;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const lexical = avg((e) => e.vocabulary_richness) ?? 0;
  const complexity = avg((e) => e.sentence_complexity) ?? 0;
  const ideas = avg((e) => e.unique_propositions);
  const tempo = avg((e) => e.speech_tempo_wpm);

  return {
    lexical: { scaled: clamp(lexical), raw: `${Math.round(lexical)}/100` },
    ideas: {
      scaled: ideas === null ? 0 : clamp((ideas / IDEA_DENSITY_CEILING) * 100),
      raw: ideas === null ? "no data" : `${Math.round(ideas)} ideas`,
    },
    complexity: { scaled: clamp(complexity), raw: `${Math.round(complexity)}/100` },
    tempo: {
      scaled: tempo === null ? 0 : clamp((tempo / TEMPO_CEILING) * 100),
      raw: tempo === null ? "not dictated" : `${Math.round(tempo)} wpm`,
    },
  };
}

export function CognitiveFootprint({ entries }: { entries: FootprintEntry[] }) {
  // entries arrive newest-first
  const latest = entries.slice(0, 1);
  const weekly = entries.slice(0, 7);

  const latestAxes = axisValues(latest);
  const weeklyAxes = axisValues(weekly);
  if (!latestAxes || !weeklyAxes) return null;

  const data = (
    [
      ["Lexical diversity", "lexical"],
      ["Idea density", "ideas"],
      ["Sentence complexity", "complexity"],
      ["Speech tempo", "tempo"],
    ] as const
  ).map(([axis, key]) => ({
    axis,
    Latest: latestAxes[key].scaled,
    "7-day average": weeklyAxes[key].scaled,
    latestRaw: latestAxes[key].raw,
    averageRaw: weeklyAxes[key].raw,
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Four measures on one shape — each scaled to 0–100 so they can sit side by side. The tooltip
        shows the real value behind each point.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="var(--color-border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "0.75rem",
                color: "var(--color-popover-foreground)",
                fontSize: "0.8rem",
              }}
              formatter={(value, name, item) => {
                const payload = item?.payload as { latestRaw: string; averageRaw: string };
                const raw = name === "Latest" ? payload.latestRaw : payload.averageRaw;
                return [`${value} (${raw})`, name as string];
              }}
            />
            <Radar
              name="7-day average"
              dataKey="7-day average"
              stroke="var(--color-chart-2)"
              fill="var(--color-chart-2)"
              fillOpacity={0.18}
            />
            <Radar
              name="Latest"
              dataKey="Latest"
              stroke="var(--color-chart-1)"
              fill="var(--color-chart-1)"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {[
          { name: "Latest entry", color: "var(--color-chart-1)" },
          { name: "7-day average", color: "var(--color-chart-2)" },
        ].map((s) => (
          <li key={s.name} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
