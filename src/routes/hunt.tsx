import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { huntPlatform, type HuntResult, type HuntPlatform } from "@/lib/hunter.functions";
import {
  Radar,
  Sparkles,
  Zap,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/hunt")({
  head: () => ({
    meta: [
      { title: "Run Product Hunter — Live Trending Scan | ProfitHunter" },
      {
        name: "description",
        content:
          "Scan Amazon, eBay, AliExpress and Shopify live with Firecrawl to surface real trending products with clickable verified URLs.",
      },
    ],
  }),
  component: HuntPage,
});

const PLATFORMS: { value: HuntPlatform; label: string; color: string }[] = [
  { value: "amazon", label: "Amazon", color: "#FF9900" },
  { value: "ebay", label: "eBay", color: "#E53238" },
  { value: "aliexpress", label: "AliExpress", color: "#FF4747" },
  { value: "shopify", label: "Shopify", color: "#95BF47" },
];

type Phase = "idle" | "scanning" | "done";
type PlatformState = "idle" | "scanning" | "done" | "error";

const SUGGESTED_MARGIN = 2.4; // assumed retail multiplier when no cost known

function HuntPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [query, setQuery] = useState("portable mini projector");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [enabled, setEnabled] = useState<Record<HuntPlatform, boolean>>({
    amazon: true,
    ebay: true,
    aliexpress: true,
    shopify: true,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<HuntResult[]>([]);
  const [pState, setPState] = useState<Record<HuntPlatform, PlatformState>>({
    amazon: "idle",
    ebay: "idle",
    aliexpress: "idle",
    shopify: "idle",
  });
  const [errors, setErrors] = useState<Partial<Record<HuntPlatform, string>>>({});
  const runId = useRef(0);

  const hunt = useServerFn(huntPlatform);

  const pushLog = (msg: string) =>
    setLogs((l) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 80),
    );

  const start = async () => {
    if (!query.trim()) return;
    const id = ++runId.current;
    setPhase("scanning");
    setLogs([]);
    setResults([]);
    setErrors({});
    const initial: Record<HuntPlatform, PlatformState> = {
      amazon: "idle",
      ebay: "idle",
      aliexpress: "idle",
      shopify: "idle",
    };
    PLATFORMS.forEach((p) => {
      if (enabled[p.value]) initial[p.value] = "scanning";
    });
    setPState(initial);
    pushLog(`🔎 Hunting "${query}" across selected marketplaces…`);

    const min = minPrice ? Number(minPrice) : undefined;
    const max = maxPrice ? Number(maxPrice) : undefined;

    const tasks = PLATFORMS.filter((p) => enabled[p.value]).map(async (p) => {
      pushLog(`→ Scraping ${p.label} via Firecrawl…`);
      try {
        const res = await hunt({
          data: { platform: p.value, query, minPrice: min, maxPrice: max, limit: 10 },
        });
        if (runId.current !== id) return;
        if (!res.ok) {
          setPState((s) => ({ ...s, [p.value]: "error" }));
          setErrors((e) => ({ ...e, [p.value]: res.error }));
          pushLog(`✖ ${p.label}: ${res.error}`);
          return;
        }
        setResults((rs) => [...rs, ...res.results]);
        setPState((s) => ({ ...s, [p.value]: "done" }));
        pushLog(`✓ ${p.label}: ${res.results.length} product${res.results.length === 1 ? "" : "s"} found`);
      } catch (err) {
        if (runId.current !== id) return;
        const msg = err instanceof Error ? err.message : "Request failed";
        setPState((s) => ({ ...s, [p.value]: "error" }));
        setErrors((e) => ({ ...e, [p.value]: msg }));
        pushLog(`✖ ${p.label}: ${msg}`);
      }
    });

    await Promise.all(tasks);
    if (runId.current !== id) return;
    pushLog(`✅ Hunt complete.`);
    setPhase("done");
  };

  useEffect(() => () => { runId.current++; }, []);

  const totalFound = results.length;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pb-24 pt-8 lg:px-8">
        <section className="card-glass relative overflow-hidden rounded-2xl p-6 md:p-8">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(circle at 30% 20%, #10b98155, transparent 60%)" }}
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs">
              <Radar className="h-3.5 w-3.5 text-primary" /> Live Firecrawl-powered scan
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">
              Run the <span className="text-gradient-primary">Product Hunter</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Enter a product idea, niche, or keyword. The hunter scrapes each marketplace
              in real time and returns clickable product URLs you can verify yourself.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_140px_140px_auto]">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Search query
                </Label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. led strip lights, posture corrector, mini projector"
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && phase !== "scanning") start();
                  }}
                />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Min $
                </Label>
                <Input
                  inputMode="decimal"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Max $
                </Label>
                <Input
                  inputMode="decimal"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="any"
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="lg"
                  onClick={start}
                  disabled={phase === "scanning" || !query.trim()}
                  className="w-full bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90 md:w-auto"
                >
                  {phase === "scanning" ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Hunting…</>
                  ) : (
                    <><Zap className="mr-2 h-4 w-4" /> {phase === "done" ? "Run again" : "Start hunting"}</>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Sources:
              </span>
              {PLATFORMS.map((p) => {
                const on = enabled[p.value];
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setEnabled((s) => ({ ...s, [p.value]: !s[p.value] }))}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                      on
                        ? "border-primary/60 bg-primary/10 text-foreground"
                        : "border-border/60 bg-surface/40 text-muted-foreground"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {PLATFORMS.map((p) => {
                const st = pState[p.value];
                return (
                  <div key={p.value} className="rounded-xl border border-border/60 bg-surface/60 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                      </div>
                      {st === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : st === "scanning" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : st === "error" ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : (
                        <span className="text-[10px] uppercase text-muted-foreground">
                          {enabled[p.value] ? "idle" : "off"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {results.filter((r) => r.platform === p.value).length} found
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                {phase === "done"
                  ? "Live results"
                  : phase === "scanning"
                  ? "Streaming results…"
                  : "Press start to begin"}
              </h2>
              {totalFound > 0 && (
                <Badge variant="outline" className="border-primary/60 text-primary">
                  {totalFound} real product{totalFound === 1 ? "" : "s"}
                </Badge>
              )}
            </div>

            {results.length === 0 ? (
              <div className="card-glass grid place-items-center rounded-2xl p-16 text-center">
                <Radar className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 max-w-md text-sm text-muted-foreground">
                  {phase === "scanning"
                    ? "Hunter is querying each marketplace via Firecrawl. Results will stream in here as they arrive."
                    : "Enter a niche above (e.g. \"posture corrector\", \"led strip lights\") and press Start hunting."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {results.map((r, i) => (
                  <ResultCard key={`${r.platform}-${i}-${r.url}`} result={r} query={query} />
                ))}
              </div>
            )}

            {Object.entries(errors).length > 0 && (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs">
                <div className="mb-1 font-semibold text-destructive">Some sources failed:</div>
                <ul className="space-y-0.5 text-muted-foreground">
                  {Object.entries(errors).map(([k, v]) => (
                    <li key={k}>
                      <span className="font-mono uppercase text-foreground">{k}</span>: {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside className="card-glass h-fit max-h-[640px] overflow-hidden rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Live hunter log
            </div>
            <div className="max-h-[580px] overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">waiting for hunt to start…</div>
              ) : (
                logs.map((l, i) => <div key={i}>{l}</div>)
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ResultCard({ result, query }: { result: HuntResult; query: string }) {
  const platform = PLATFORMS.find((p) => p.value === result.platform)!;
  const estRetail = result.price != null ? result.price * SUGGESTED_MARGIN : null;
  const profit = result.price != null && estRetail != null ? estRetail - result.price : null;
  const { isSaved, toggle } = useSavedProducts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const saved = isSaved(result.url);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Sign in to save products across devices");
      navigate({ to: "/auth", search: { redirect: "/hunt" } });
      return;
    }
    const res = await toggle(result, query);
    if (res?.error) toast.error(res.error);
    else if (!saved) toast.success("Saved to your shortlist");
  };

  return (
    <div className="card-glass group relative flex animate-in fade-in slide-in-from-bottom-2 flex-col gap-2 rounded-xl p-3 transition hover:-translate-y-0.5">
      <button
        type="button"
        onClick={handleSave}
        aria-label={saved ? "Remove from saved" : "Save product"}
        className={`absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border transition ${
          saved
            ? "border-gold/60 bg-gold/15 text-gold"
            : "border-border/60 bg-surface/80 text-muted-foreground hover:text-foreground"
        }`}
      >
        {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
      </button>
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 pr-10">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platform.color }} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {platform.label}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground transition group-hover:text-primary" />
        </div>
        <div className="line-clamp-2 text-sm font-semibold leading-snug">{result.title}</div>
        {result.description && (
          <div className="line-clamp-2 text-[11px] text-muted-foreground">{result.description}</div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
          {result.price != null ? (
            <>
              <span className="font-mono font-semibold text-foreground">${result.price.toFixed(2)}</span>
              {estRetail != null && (
                <span className="text-muted-foreground">
                  est. resell <span className="text-foreground">${estRetail.toFixed(2)}</span>
                </span>
              )}
              {profit != null && (
                <span className="font-mono text-primary">+${profit.toFixed(2)} est. profit</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Price on listing</span>
          )}
        </div>
        <div className="truncate text-[10px] text-muted-foreground/70">{result.url}</div>
      </a>
    </div>
  );
}
