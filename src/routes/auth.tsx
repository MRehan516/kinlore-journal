import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in to KinLore" },
      {
        name: "description",
        content: "Sign in to KinLore with a magic link sent to your email address.",
      },
      { property: "og:title", content: "Sign in to KinLore" },
      { property: "og:description", content: "Sign in with a magic link sent to your email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void navigate({ to: "/app" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void navigate({ to: "/app" });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus("sending");
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/app` },
    });
    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="font-serif text-xl font-semibold tracking-tight">
          KinLore
        </Link>
        <h1 className="mt-6 font-serif text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We'll email you a link that signs you in. No password to remember.
        </p>

        {status === "sent" ? (
          <Alert className="mt-8">
            <MailCheck className="h-4 w-4" aria-hidden />
            <AlertDescription>
              Check <span className="font-medium">{email}</span> for your sign-in link. You can
              close this tab — the link opens KinLore for you.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={sendLink} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send magic link
            </Button>
          </form>
        )}

        <p className="mt-8 text-sm text-muted-foreground">
          Viewing someone's summary?{" "}
          <Link to="/shared" className="underline underline-offset-4">
            Enter a share code
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
