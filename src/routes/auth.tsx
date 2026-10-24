import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, Loader2, Mail, Lock, Sparkles } from "lucide-react";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — ProfitHunter" },
      { name: "description", content: "Sign in to sync your saved winning products across devices." },
    ],
  }),
  component: AuthPage,
});

type Tab = "signin" | "signup" | "magic";

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [tab, setTab] = useState<Tab>(search.mode === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<null | "email" | "google" | "magic">(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: (search.redirect as "/saved") || "/saved" });
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate({ to: (search.redirect as "/saved") || "/saved" });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, search.redirect]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading("email");
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/saved" },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(null);
    }
  };

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading("magic");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + "/saved" },
      });
      if (error) throw error;
      toast.success("Magic link sent — check your inbox.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send link");
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading("google");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/saved" },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 pb-24 pt-12">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary glow-primary">
            <Crown className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {tab === "signup" ? "Create your hunter account" : "Welcome back, hunter"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sync your saved winning products across every device.
          </p>
        </div>

        <div className="card-glass rounded-2xl p-5">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogle}
            disabled={loading !== null}
          >
            {loading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border/60" /> or <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="mb-4 flex gap-1 rounded-lg bg-surface/40 p-1 text-xs">
            {(["signin", "signup", "magic"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-md px-3 py-1.5 transition ${
                  tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "signin" ? "Sign in" : t === "signup" ? "Sign up" : "Magic link"}
              </button>
            ))}
          </div>

          <form onSubmit={tab === "magic" ? handleMagic : handleEmail} className="space-y-3">
            <div>
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9"
                />
              </div>
            </div>

            {tab !== "magic" && (
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Password</Label>
                <div className="relative mt-1">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="password"
                    required
                    minLength={6}
                    autoComplete={tab === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading !== null}
              className="w-full bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90"
            >
              {loading === "email" || loading === "magic" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : tab === "magic" ? (
                <Sparkles className="mr-2 h-4 w-4" />
              ) : null}
              {tab === "signup" ? "Create account" : tab === "magic" ? "Send magic link" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">← Back to dashboard</Link>
        </p>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.3l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.5l6.2 5.2c-.4.4 6.6-4.8 6.6-14.7 0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
