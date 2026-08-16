import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/Disclaimer";
import { SCORE_LABELS } from "@/lib/kinlore";
import { useEntries } from "@/hooks/useEntries";

export const Route = createFileRoute("/_authenticated/app/entries")({
  head: () => ({
    meta: [
      { title: "My entries — KinLore" },
      {
        name: "description",
        content: "Every KinLore entry you've saved, listed with its scores. Your words are never kept.",
      },
      { property: "og:title", content: "My entries — KinLore" },
      { property: "og:description", content: "Every entry you've saved, listed with its scores." },
    ],
  }),
  component: EntriesPage,
});

function EntriesPage() {
  const entries = useEntries();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <header>
        <h1 className="font-serif text-3xl">My entries</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each row is one entry. Only these numbers were kept — the text was scored and discarded.
        </p>
      </header>

      <Disclaimer />

      {entries.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : entries.isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>We couldn't load your entries.</span>
            <Button size="sm" variant="outline" onClick={() => void entries.refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : (entries.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-muted-foreground">You haven't saved an entry yet.</p>
            <Button asChild>
              <Link to="/app">Write today's entry</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {(entries.data ?? []).map((entry) => (
            <li key={entry.id}>
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <time className="font-serif text-lg" dateTime={entry.created_at}>
                      {new Date(entry.created_at).toLocaleDateString(undefined, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <span className="text-xs text-muted-foreground">{entry.word_count} words</span>
                  </div>
                  <p className="text-sm italic text-muted-foreground">{entry.prompt}</p>
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {(
                      ["vocabulary_richness", "sentence_complexity", "clarity", "sentiment"] as const
                    ).map((key) => (
                      <div key={key} className="rounded-lg bg-secondary/60 px-3 py-2">
                        <dt className="text-xs text-muted-foreground">{SCORE_LABELS[key]!.label}</dt>
                        <dd className="font-serif text-xl">{Math.round(entry[key])}</dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
