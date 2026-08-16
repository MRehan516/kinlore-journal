import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Loader2, Share2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Disclaimer } from "@/components/Disclaimer";
import { TrendChart } from "@/components/TrendChart";
import { promptForDate } from "@/lib/kinlore";
import { analyzeEntry } from "@/lib/analysis.functions";
import { createShare } from "@/lib/sharing.functions";
import { entriesQueryKey, sharesQueryKey, useEntries, useShares, shareStatus } from "@/hooks/useEntries";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({
    meta: [
      { title: "Today's entry — KinLore" },
      {
        name: "description",
        content: "Write today's KinLore entry and see gentle patterns across your recent writing.",
      },
      { property: "og:title", content: "Today's entry — KinLore" },
      { property: "og:description", content: "Write today's entry and see your recent patterns." },
    ],
  }),
  component: HomePage,
});

type SpeechState = "unsupported" | "idle" | "listening" | "error";

function HomePage() {
  const prompt = useMemo(() => promptForDate(new Date()), []);
  const [text, setText] = useState("");
  const [speech, setSpeech] = useState<SpeechState>("idle");
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  // Dictation timing — accumulated across every recording burst for this entry.
  const dictationMsRef = useRef(0);
  const dictationStartRef = useRef<number | null>(null);
  const [dictationUsed, setDictationUsed] = useState(false);

  const queryClient = useQueryClient();
  const entries = useEntries();
  const shares = useShares();
  const analyze = useServerFn(analyzeEntry);
  const makeShare = useServerFn(createShare);

  function stopTimer() {
    if (dictationStartRef.current !== null) {
      dictationMsRef.current += Date.now() - dictationStartRef.current;
      dictationStartRef.current = null;
    }
  }

  function speechTempoWpm(): number | null {
    if (!dictationUsed) return null;
    const seconds = dictationMsRef.current / 1000;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (seconds < 2 || words === 0) return null;
    return Math.round((words / seconds) * 60);
  }


  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeech("unsupported");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event: any) => {
      let chunk = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        chunk += event.results[i][0].transcript;
      }
      if (chunk.trim()) setText((prev) => (prev ? `${prev} ${chunk.trim()}` : chunk.trim()));
    };
    recognition.onerror = () => {
      setSpeech("error");
      setSpeechMessage("Dictation stopped working. You can keep typing below.");
    };
    recognition.onend = () => setSpeech((s) => (s === "listening" ? "idle" : s));
    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  function toggleDictation() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (speech === "listening") {
      recognition.stop();
      setSpeech("idle");
      return;
    }
    try {
      recognition.start();
      setSpeech("listening");
      setSpeechMessage(null);
    } catch {
      setSpeech("error");
      setSpeechMessage("Dictation couldn't start. You can keep typing below.");
    }
  }

  const save = useMutation({
    mutationFn: () => analyze({ data: { text, prompt } }),
    onSuccess: () => {
      setText(""); // the draft only ever lived here
      void queryClient.invalidateQueries({ queryKey: entriesQueryKey });
      toast.success("Saved. Your words were scored and then discarded.");
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong. Please try again."),
  });

  const share = useMutation({
    mutationFn: () => makeShare({ data: {} }),
    onSuccess: (result) => {
      setNewCode(result.code);
      void queryClient.invalidateQueries({ queryKey: sharesQueryKey });
    },
    onError: () => toast.error("We couldn't create a share code. Please try again."),
  });

  const activeShares = (shares.data ?? []).filter((s) => shareStatus(s) === "active");
  const points = entries.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <section>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Today's prompt</p>
        <h1 className="mt-2 font-serif text-3xl leading-snug">{prompt}</h1>
      </section>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Start typing here…"
            className="min-h-48 resize-y text-base"
            aria-label="Your entry"
          />
          <p className="text-xs text-muted-foreground">
            {text.trim() ? `${text.trim().split(/\s+/).length} words` : "Nothing written yet"} · Your
            text is sent for scoring and then discarded. It is never stored.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => save.mutate()} disabled={save.isPending || text.trim().length < 40}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save entry
            </Button>

            {speech !== "unsupported" && (
              <Button type="button" variant="outline" onClick={toggleDictation}>
                {speech === "listening" ? (
                  <MicOff className="mr-2 h-4 w-4" />
                ) : (
                  <Mic className="mr-2 h-4 w-4" />
                )}
                {speech === "listening" ? "Stop dictation" : "Dictate instead"}
              </Button>
            )}
          </div>

          {speech === "unsupported" && (
            <p className="text-sm text-muted-foreground">
              Dictation isn't available in this browser — typing above works exactly the same.
            </p>
          )}
          {speechMessage && (
            <Alert>
              <AlertDescription>{speechMessage}</AlertDescription>
            </Alert>
          )}
          {text.trim().length > 0 && text.trim().length < 40 && (
            <p className="text-sm text-muted-foreground">
              A little more writing gives more meaningful numbers — 40 characters or so.
            </p>
          )}
        </CardContent>
      </Card>

      <Disclaimer />

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Your recent entries</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-4 w-1/2" />
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
          ) : points.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No entries yet. Once you save your first one, a chart of your recent writing appears
              here.
            </p>
          ) : points.length === 1 ? (
            <p className="text-sm text-muted-foreground">
              One entry saved. Patterns start to show after a few more — come back tomorrow.
            </p>
          ) : (
            <TrendChart points={points} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Share with someone I trust</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            A share code lets one person view this same read-only summary. They never see anything
            you wrote. Codes expire after 30 days and you can revoke them at any time.
          </p>

          {newCode && (
            <Alert>
              <AlertDescription className="space-y-2">
                <span className="block text-sm">
                  Copy this code now — it's shown once and never stored in readable form:
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

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => share.mutate()} disabled={share.isPending}>
              {share.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="mr-2 h-4 w-4" />
              )}
              Share with someone I trust
            </Button>
            {activeShares.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {activeShares.length} active {activeShares.length === 1 ? "code" : "codes"} — manage
                or revoke them on the Sharing page.
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
