import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Disclaimer } from "@/components/Disclaimer";
import { TrendChart } from "@/components/TrendChart";
import { redeemShareCode, type SharedSummary } from "@/lib/shared-view.functions";

export const Route = createFileRoute("/shared")({
  head: () => ({
    meta: [
      { title: "View a shared KinLore summary" },
      {
        name: "description",
        content:
          "Enter a KinLore share code to view someone's read-only writing summary. No journal text is ever shown.",
      },
      { property: "og:title", content: "View a shared KinLore summary" },
      {
        property: "og:description",
        content: "Enter a share code to view a read-only writing summary.",
      },
    ],
  }),
  component: SharedPage,
});

function SharedPage() {
  const [code, setCode] = useState("");
  const redeem = useServerFn(redeemShareCode);
  const [summary, setSummary] = useState<SharedSummary | null>(null);

  const lookup = useMutation({
    mutationFn: () => redeem({ data: { code: code.trim() } }),
    onSuccess: (result) => setSummary(result),
  });

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <Link to="/" className="font-serif text-xl font-semibold tracking-tight">
        KinLore
      </Link>

      <header>
        <h1 className="font-serif text-3xl">A shared summary</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Someone gave you a code to view how their writing has looked over recent entries. You will
          never see anything they wrote.
        </p>
      </header>

      <Disclaimer />

      {!summary && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                lookup.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="code">Share code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste the code you were given"
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
              {lookup.isError && (
                <Alert variant="destructive">
                  <AlertDescription>{(lookup.error as Error).message}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={lookup.isPending || !code.trim()}>
                {lookup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                View summary
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Their recent entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                There are no saved entries to show yet. Try again in a few days.
              </p>
            ) : summary.entries.length === 1 ? (
              <p className="text-sm text-muted-foreground">
                Only one entry so far — patterns need a few more before a chart says anything.
              </p>
            ) : (
              <TrendChart points={summary.entries} />
            )}
            <p className="text-xs text-muted-foreground">
              Read-only. This code stops working on{" "}
              {new Date(summary.expires_at).toLocaleDateString()}, or sooner if access is revoked.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
