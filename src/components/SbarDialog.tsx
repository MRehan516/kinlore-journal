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

export function buildSbar(entries: EntryRow[], now = Date.now()): string | null {
  const recent = entries.filter((e) => new Date(e.created_at).getTime() >= now - 7 * DAY);
  if (recent.length === 0) return null;

  const cur = collect(recent);
  const from = new Date(now - 7 * DAY).toISOString().slice(0, 10);
  const to = new Date(now).toISOString().slice(0, 10);

  return [
    DISCLAIMER,
    "",
    "Data Summary (Last 7 Days)",
    "",
    `Date Range: ${from} to ${to}`,
    `Total Entries: ${cur.count}`,
    `Average Speech Tempo: ${fmt(cur.tempo, 0, " wpm")}`,
    `Average Lexical Diversity (Brunét's Index): ${fmt(cur.brunet, 2)}`,
    `Average Idea Density: ${fmt(cur.ideas, 1)}`,
    `Average Entry Length: ${fmt(cur.words, 0, " words")}`,
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
