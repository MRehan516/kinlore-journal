import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Share2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Disclaimer } from "@/components/Disclaimer";
import { createShare, revokeShare } from "@/lib/sharing.functions";
import { sharesQueryKey, shareStatus, useShares } from "@/hooks/useEntries";

export const Route = createFileRoute("/_authenticated/app/sharing")({
  head: () => ({
    meta: [
      { title: "Sharing — KinLore" },
      {
        name: "description",
        content: "Create, review and revoke the share codes that let someone view your KinLore summary.",
      },
      { property: "og:title", content: "Sharing — KinLore" },
      { property: "og:description", content: "Manage the share codes for your read-only summary." },
    ],
  }),
  component: SharingPage,
});

function SharingPage() {
  const [label, setLabel] = useState("");
  const [newCode, setNewCode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const shares = useShares();
  const makeShare = useServerFn(createShare);
  const dropShare = useServerFn(revokeShare);

  const create = useMutation({
    mutationFn: () => makeShare({ data: label.trim() ? { label: label.trim() } : {} }),
    onSuccess: (result) => {
      setNewCode(result.code);
      setLabel("");
      void queryClient.invalidateQueries({ queryKey: sharesQueryKey });
    },
    onError: () => toast.error("We couldn't create a share code. Please try again."),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => dropShare({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sharesQueryKey });
      toast.success("Access revoked. That code no longer works.");
    },
    onError: () => toast.error("We couldn't revoke that code. Please try again."),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <header>
        <h1 className="font-serif text-3xl">Sharing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A share code gives one person read-only access to the same trend summary you see. They
          never see anything you wrote. Codes expire after 30 days.
        </p>
      </header>

      <Disclaimer />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="label">Who is this for? (optional)</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My sister"
              maxLength={60}
            />
          </div>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" />
            )}
            Create share code
          </Button>

          {newCode && (
            <Alert>
              <AlertDescription className="space-y-2">
                <span className="block text-sm">
                  Copy this now — we store only a hash of it, so it cannot be shown again.
                </span>
                <code className="block break-all rounded-md bg-secondary px-3 py-2 font-mono text-sm">
                  {newCode}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    void navigator.clipboard.writeText(newCode);
                    toast.success("Code copied");
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy code
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">Your share codes</h2>
        {shares.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : shares.isError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between gap-4">
              <span>We couldn't load your share codes.</span>
              <Button size="sm" variant="outline" onClick={() => void shares.refetch()}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        ) : (shares.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven't shared with anyone. Nothing of yours is visible to anyone else.
          </p>
        ) : (
          <ul className="space-y-3">
            {(shares.data ?? []).map((share) => {
              const status = shareStatus(share);
              return (
                <li key={share.id}>
                  <Card>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                      <div>
                        <p className="font-medium">
                          {share.label ?? "Untitled share"}{" "}
                          <span className="font-mono text-sm text-muted-foreground">
                            {share.code_prefix}…
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(share.created_at).toLocaleDateString()} ·{" "}
                          {status === "active"
                            ? `expires ${new Date(share.expires_at).toLocaleDateString()}`
                            : status === "expired"
                              ? "expired"
                              : `revoked ${new Date(share.revoked_at!).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={status === "active" ? "default" : "secondary"}>
                          {status}
                        </Badge>
                        {status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revoke.mutate(share.id)}
                            disabled={revoke.isPending}
                          >
                            Revoke access
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
