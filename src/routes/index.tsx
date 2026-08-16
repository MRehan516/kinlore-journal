import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { PenLine, ShieldCheck, LineChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KinLore — See patterns in how you write" },
      {
        name: "description",
        content:
          "A private journal that keeps only the numbers about how you write — never your words. Watch gentle patterns over time and share a read-only summary if you choose.",
      },
      { property: "og:title", content: "KinLore — See patterns in how you write" },
      {
        property: "og:description",
        content:
          "A private journal that keeps only the numbers about how you write — never your words.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-serif text-xl font-semibold tracking-tight">KinLore</span>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/shared">Have a share code?</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-10 md:pt-20">
        <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-6xl">
          A journal that remembers the shape of your writing, not the words.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          You write to a daily prompt. KinLore measures a few things about how you wrote —
          word variety, sentence structure, idea density, semantic repetition — stores only those
          numbers, and throws the text away. Over time you can see gentle patterns in your own
          writing.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Start journaling</Link>
          </Button>
        </div>

        <Disclaimer className="mt-10 max-w-2xl" />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <Feature
            icon={<PenLine className="h-5 w-5" aria-hidden />}
            title="Write, don't file"
            body="One prompt a day. Type it or dictate it. Nothing to organise afterwards."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
            title="Your words stay yours"
            body="Raw text is never saved — not on our servers, not in your browser. Only four numbers per entry."
          />
          <Feature
            icon={<LineChart className="h-5 w-5" aria-hidden />}
            title="Honest measurement"
            body="Word variety and sentence structure are computed with real formulas, not guessed by a model."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-accent">{icon}</div>
      <h2 className="mt-3 font-serif text-lg">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
