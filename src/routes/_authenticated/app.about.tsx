import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Disclaimer } from "@/components/Disclaimer";
import { SCORE_LABELS } from "@/lib/kinlore";

export const Route = createFileRoute("/_authenticated/app/about")({
  head: () => ({
    meta: [
      { title: "About KinLore" },
      {
        name: "description",
        content:
          "What KinLore measures, how each score is produced, what is never stored, and where to go for real help with memory concerns.",
      },
      { property: "og:title", content: "About KinLore" },
      {
        property: "og:description",
        content: "What KinLore measures, what it never stores, and where to get real help.",
      },
    ],
  }),
  component: AboutPage,
});

const RESOURCES = [
  {
    name: "Alzheimer's Association (US) — 24/7 Helpline 800.272.3900",
    url: "https://www.alz.org/",
  },
  { name: "Alzheimer's Society (UK)", url: "https://www.alzheimers.org.uk/" },
  { name: "NHS — Memory loss and dementia", url: "https://www.nhs.uk/conditions/dementia/" },
  {
    name: "World Health Organization — Dementia",
    url: "https://www.who.int/news-room/fact-sheets/detail/dementia",
  },
];

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <header>
        <h1 className="font-serif text-3xl">About KinLore</h1>
        <p className="mt-2 text-muted-foreground">
          KinLore is a journal that keeps numbers about your writing instead of your writing.
        </p>
      </header>

      <Disclaimer />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">What is measured, and how</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(SCORE_LABELS).map(([key, value]) => (
            <div key={key}>
              <h3 className="font-medium">{value.label}</h3>
              <p className="text-sm text-muted-foreground">{value.help}</p>
            </div>
          ))}
          <p className="text-sm text-muted-foreground">
            Word variety and sentence structure are arithmetic — the same text always gives the same
            number. Clarity and tone are judgements from a language model, so treat them as loose
            impressions rather than measurements.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">What KinLore never keeps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Your entry is sent once for scoring and then discarded. It is not written to the
            database, not cached, and not saved in your browser — if you reload the page mid-entry,
            the draft is gone.
          </p>
          <p>
            What is stored: the date, the prompt shown, the word count, and four scores. Someone
            holding a share code sees only the dates and the scores.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">What this is not</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            KinLore cannot detect, screen for, or rule out any condition. Writing scores move around
            for ordinary reasons: tiredness, mood, how much time you had, whether you dictated or
            typed, what the prompt asked. A dip is not a finding.
          </p>
          <p>
            If you are worried about memory or thinking — yours or someone else's — please speak to
            a doctor. These organisations offer real information and support:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {RESOURCES.map((resource) => (
              <li key={resource.url}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {resource.name}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
