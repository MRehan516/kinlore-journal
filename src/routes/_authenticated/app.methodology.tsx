import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/Disclaimer";

export const Route = createFileRoute("/_authenticated/app/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology & Research — KinLore" },
      {
        name: "description",
        content:
          "How KinLore computes every number: Brunét's Index, semantic proposition extraction, speech tempo, and zero-data retention.",
      },
      { property: "og:title", content: "Methodology & Research — KinLore" },
      {
        property: "og:description",
        content: "Every KinLore number is arithmetic or a counted extraction — never an opinion.",
      },
    ],
  }),
  component: MethodologyPage,
});

function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-secondary/60 px-4 py-3 font-mono text-sm">
      <code>{children}</code>
    </pre>
  );
}

function Citation({ children }: { children: ReactNode }) {
  return (
    <p className="border-l-2 border-border pl-4 text-sm leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 leading-relaxed">{children}</CardContent>
    </Card>
  );
}

function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <header>
        <h1 className="font-serif text-3xl">Methodology &amp; Research</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Every number in KinLore is either plain arithmetic over your words or a counted
          extraction — never an opinion about you.
        </p>
      </header>

      <Disclaimer />

      <Section title="1. Lexical Diversity (Brunét's Index)">
        <p>
          Vocabulary richness is measured from two counts taken directly from your entry: the total
          number of words (<strong>N</strong>) and the number of distinct words (<strong>V</strong>).
          A naive ratio of the two drifts badly with length — longer writing almost always repeats
          more, so it would look "poorer" simply for being longer. Brunét's Index avoids that by
          placing the vocabulary count in the exponent, which makes the resulting value close to
          length-invariant and therefore comparable between a short morning note and a long one.
        </p>
        <Formula>W = N^(V^-0.165)</Formula>
        <p>
          Lower <strong>W</strong> corresponds to richer vocabulary. KinLore stores the raw value and
          also maps it onto a friendlier 0–100 scale for the charts, so a single unusual entry never
          dominates the picture.
        </p>
        <Citation>
          Brunét, É. (1978). <em>Le Vocabulaire de Jean Giraudoux: Structure et Évolution.</em>{" "}
          Slatkine. The index comes out of quantitative corpus stylometry, where length-stable
          measures of vocabulary are used to compare texts across time. Later computational
          linguistic work has examined vocabulary contraction in longitudinal writing samples as one
          descriptive signal among many. That literature is research context for why this measure is
          interesting to track — it is not a threshold, a screening instrument, or a diagnosis.
        </Citation>
      </Section>

      <Section title="2. Semantic Proposition Extraction (Featherless AI)">
        <p>
          Two of the numbers cannot be counted with arithmetic, because they require actually
          understanding language: how many <strong>distinct ideas</strong> an entry expresses (Idea
          Density) and how many of those ideas are <strong>restated</strong> within the same entry
          (Repetition Count). For these, and only these, the entry is sent from the server to
          Featherless for inference on{" "}
          <code className="rounded bg-secondary/60 px-1 py-0.5 font-mono text-sm">
            meta-llama/Meta-Llama-3.1-8B-Instruct
          </code>
          .
        </p>
        <p>
          The call uses structured tool-calling rather than free-form text. The model is given a
          fixed schema — <code className="font-mono text-sm">extract_language_features</code> — whose
          only fields are two integers, and it is instructed to count structural features and to say
          nothing about the writer's state. There is no free text in the response, so there is
          nothing subjective to store or display.
        </p>
        <p>
          The separation is deliberate and strict: deterministic mathematics happens in code before
          the model is ever contacted, and the model contributes only counts. If the inference call
          fails or is unavailable, it is treated as non-fatal — the entry still saves with its
          computed metrics, and the two extracted counts are simply recorded as empty.
        </p>
      </Section>

      <Section title="3. Acoustic Speech Tempo (WPM)">
        <p>
          When you dictate instead of typing, the browser's speech recognition session is timed
          passively. KinLore records the elapsed seconds you spent actually speaking — accumulated
          across every dictation burst in a sitting, with pauses between bursts excluded — and
          divides the resulting word count by that speaking time:
        </p>
        <Formula>WPM = (words / speaking seconds) × 60</Formula>
        <p>
          Tempo is a temporal and psychomotor measure rather than a linguistic one: it describes
          pacing, hesitancy, and how that pacing varies from one sitting to the next. No audio is
          recorded, transmitted, or stored at any point — only the elapsed duration is used. Entries
          you type by hand carry no tempo value and are shown as blank in the charts rather than
          being counted as zero.
        </p>
      </Section>

      <Section title="4. Data Privacy Architecture (Zero-Data Retention)">
        <p>
          Raw journal text is never persisted anywhere. It exists in the page while you are writing,
          is posted to a server function, and lives in that function's memory only for the duration
          of the request.
        </p>
        <p>
          Within that request the text is counted for the deterministic metrics and passed once to
          the extraction model. Then the request ends and the text goes out of scope — nothing writes
          it to a table, a log, a file, or browser storage. What is written to the database is
          exclusively numbers: word count, unique word count, Brunét's Index, the two extracted
          counts, speech tempo, and the prompt you were answering.
        </p>
        <p>
          Share codes follow the same principle. A person you share with sees the same numeric
          summary you do and never has any path to text, because no text exists to reach.
        </p>
      </Section>

      <Disclaimer />
    </div>
  );
}
