import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClipboardCopy, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Disclaimer } from "@/components/Disclaimer";
import { DISCLAIMER } from "@/lib/kinlore";
import type { EntryRow } from "@/hooks/useEntries";

const DAY = 24 * 60 * 60 * 1000;

function mean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function collect(entries: EntryRow[]) {
  return {
    count: entries.length,
    brunet: mean(entries.map((e) => Number(e.brunet_w)).filter((v) => !Number.isNaN(v))),
    ideas: mean(
      entries.map((e) => e.unique_propositions).filter((v): v is number => v !== null),
    ),
    tempo: mean(
      entries.map((e) => e.speech_tempo_wpm).filter((v): v is number => v !== null),
    ),
    words: mean(entries.map((e) => e.word_count)),
  };
}

function fmt(value: number | null, digits = 1, suffix = "") {
  return value === null ? "no data" : `${value.toFixed(digits)}${suffix}`;
}

function direction(current: number | null, previous: number | null, label: string) {
  if (current === null || previous === null) {
    return `${label}: no comparable prior-week measurement.`;
  }
  const delta = current - previous;
  const pct = previous === 0 ? 0 : (delta / Math.abs(previous)) * 100;
  const word = Math.abs(pct) < 5 ? "unchanged" : delta > 0 ? "higher" : "lower";
  return `${label}: ${word} than the preceding 7 days (${delta >= 0 ? "+" : ""}${pct.toFixed(1)}%).`;
}

export function buildSbar(entries: EntryRow[], now = Date.now()): string | null {
  const recent = entries.filter((e) => new Date(e.created_at).getTime() >= now - 7 * DAY);
  if (recent.length === 0) return null;
  const prior = entries.filter((e) => {
    const t = new Date(e.created_at).getTime();
    return t < now - 7 * DAY && t >= now - 14 * DAY;
  });

  const cur = collect(recent);
  const prev = collect(prior);
  const from = new Date(now - 7 * DAY).toISOString().slice(0, 10);
  const to = new Date(now).toISOString().slice(0, 10);

  return [
    "SBAR — KinLore self-reflection summary",
    `Reporting period: ${from} to ${to}`,
    "",
    "SITUATION",
    `Self-directed journaling record covering ${cur.count} ${cur.count === 1 ? "entry" : "entries"} over the last 7 days, shared voluntarily by the writer for discussion at a clinical appointment.`,
    "",
    "BACKGROUND",
    "KinLore records only computed language measures from each journal entry; the journal text itself is never stored. Measures are: Brunet's Index (lexical diversity, computed deterministically), idea density (count of distinct propositions per entry, extracted by a language model), and speech tempo in words per minute (recorded only when the entry was dictated).",
    `Average entry length: ${fmt(cur.words, 0, " words")}.`,
    "",
    "ASSESSMENT",
    `7-day average Brunet's Index: ${fmt(cur.brunet, 2)}.`,
    `7-day average idea density: ${fmt(cur.ideas, 1, " distinct ideas per entry")}.`,
    `7-day average speech tempo: ${fmt(cur.tempo, 0, " wpm")}.`,
    prior.length === 0
      ? "No entries were recorded in the preceding 7 days, so no comparison is available."
      : [
          direction(cur.brunet, prev.brunet, "Lexical diversity"),
          direction(cur.ideas, prev.ideas, "Idea density"),
          direction(cur.tempo, prev.tempo, "Speech tempo"),
        ].join("\n"),
    "These are descriptive measurements of writing output only. They are not clinical findings and carry no diagnostic meaning.",
    "",
    "RECOMMENDATION",
    "Review these measurements alongside the person's own account of their memory, mood, sleep and daily function. Any clinical concern should be assessed with validated instruments and standard examination; this record is not a substitute for either.",
    "",
    DISCLAIMER,
  ].join("\n");
}

export function SbarDialog({ entries }: { entries: EntryRow[] }) {
  const [open, setOpen] = useState(false);
  const sbar = useMemo(() => (open ? buildSbar(entries) : null), [open, entries]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <FileText className="mr-2 h-4 w-4" />
          Generate Physician SBAR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Physician handoff (SBAR)</DialogTitle>
          <DialogDescription>
            A plain-text summary of your last 7 days of measurements, formatted for a clinician.
          </DialogDescription>
        </DialogHeader>

        <Disclaimer />

        {sbar === null ? (
          <p className="text-sm text-muted-foreground">
            There are no entries from the last 7 days yet, so there's nothing to summarise. Save an
            entry and this report will fill in.
          </p>
        ) : (
          <>
            <pre className="whitespace-pre-wrap rounded-lg bg-secondary/60 p-4 font-mono text-xs leading-relaxed">
              {sbar}
            </pre>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(sbar);
                toast.success("SBAR copied to clipboard");
              }}
            >
              <ClipboardCopy className="mr-2 h-4 w-4" />
              Copy SBAR
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
