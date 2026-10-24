import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  PRODUCTS,
  PLATFORMS,
  CATEGORIES,
  computeMargin,
  computeProfit,
  computeWinningScore,
  type Platform,
  type Category,
} from "@/lib/products-data";
import { SiteNav } from "@/components/site-nav";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crown, TrendingUp, ArrowRight, Flame, BarChart3 } from "lucide-react";

const VALID: Platform[] = ["amazon", "ebay", "aliexpress", "shopify"];

export const Route = createFileRoute("/store/$platform")({
  beforeLoad: ({ params }) => {
    if (!VALID.includes(params.platform as Platform)) throw notFound();
  },
  head: ({ params }) => {
    const pl = PLATFORMS.find((p) => p.value === params.platform);
    const label = pl?.label ?? "Store";
    return {
      meta: [
        { title: `${label} — Top Trending Products | ProfitHunter` },
        {
          name: "description",
          content: `Top trending high-margin dropshipping products on ${label}, ranked by AI winning score.`,
        },
      ],
    };
  },
  component: StorePage,
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteNav />
      <div className="grid place-items-center p-20 text-center">
        <h1 className="font-display text-2xl font-bold">Unknown store</h1>
        <Link to="/" className="mt-4 text-primary underline">Back to dashboard</Link>
      </div>
    </div>
  ),
});

function StorePage() {
  const { platform } = Route.useParams();
  const pl = PLATFORMS.find((p) => p.value === (platform as Platform))!;
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState<"winning" | "trend" | "margin" | "sales">("winning");

  const items = useMemo(() => {
    let list = PRODUCTS.filter((p) => p.platform === platform).map((p) => ({
      ...p,
      _m: computeMargin(p),
      _p: computeProfit(p),
      _s: computeWinningScore(p),
    }));
    if (category !== "all") list = list.filter((p) => p.category === category);
    list.sort((a, b) => {
      if (sort === "winning") return b._s - a._s;
      if (sort === "trend") return b.trendScore - a.trendScore;
      if (sort === "margin") return b._m - a._m;
      return b.unitsSold30d - a.unitsSold30d;
    });
    return list;
  }, [platform, category, sort]);

  const stats = useMemo(() => {
    const n = items.length || 1;
    return {
      count: items.length,
      avgMargin: items.reduce((s, p) => s + p._m, 0) / n,
      avgProfit: items.reduce((s, p) => s + p._p, 0) / n,
      hot: items.filter((p) => p._s >= 75).length,
    };
  }, [items]);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pb-24 pt-8 lg:px-8">
        <section
          className="card-glass relative overflow-hidden rounded-2xl p-8"
          style={{ background: `linear-gradient(135deg, ${pl.color}22, transparent 70%)` }}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg text-lg font-bold text-white" style={{ backgroundColor: pl.color }}>
              {pl.label.charAt(0)}
            </span>
            <div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Store</div>
              <h1 className="font-display text-3xl font-bold">{pl.label}</h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Real-time trending products on {pl.label}, ranked by ProfitHunter's AI winning score.
            Filter by category, sort by margin or momentum, and dive into the full AI analysis.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat icon={<BarChart3 />} label="Products" value={stats.count.toString()} />
            <Stat icon={<TrendingUp />} label="Avg margin" value={`${stats.avgMargin.toFixed(0)}%`} />
            <Stat icon={<TrendingUp />} label="Avg profit" value={`$${stats.avgProfit.toFixed(2)}`} />
            <Stat icon={<Flame />} label="Hot picks" value={stats.hot.toString()} accent />
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="min-w-[200px]">
            <Select value={category} onValueChange={(v) => setCategory(v as Category | "all")}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="winning">🏆 Winning score</SelectItem>
                <SelectItem value="trend">🔥 Trend momentum</SelectItem>
                <SelectItem value="margin">💰 Highest margin</SelectItem>
                <SelectItem value="sales">📈 Most sales</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link to="/hunt" className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs text-primary hover:bg-primary/25">
            Run live hunt <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="card-glass mt-6 grid place-items-center rounded-2xl p-16 text-center text-sm text-muted-foreground">
            No products in this category for {pl.label}.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <article key={p.id} className="card-glass group overflow-hidden rounded-2xl transition hover:-translate-y-0.5">
                <div className="relative h-32 overflow-hidden" style={{ background: p.gradient }}>
                  <div className="absolute inset-0 grid place-items-center text-6xl">{p.emoji}</div>
                  <Badge className="absolute left-3 top-3 border-0 bg-black/60 text-white">#{i + 1}</Badge>
                  {p._s >= 80 && (
                    <Badge className="absolute right-3 top-3 border-0 bg-gold text-gold-foreground">
                      <Crown className="mr-1 h-3 w-3" /> Winning
                    </Badge>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 min-h-[2.6em] text-sm font-semibold">{p.title}</h3>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      ${p.supplierPrice.toFixed(2)} → ${p.retailPrice.toFixed(2)}
                    </span>
                    <span className="font-mono font-bold text-primary">+${p._p.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px]">
                    <span className="text-muted-foreground">Margin <span className="font-mono text-foreground">{p._m.toFixed(0)}%</span></span>
                    <span className="text-muted-foreground">Trend <span className="font-mono text-foreground">{p.trendScore}</span></span>
                    <span className="text-muted-foreground">Sold <span className="font-mono text-foreground">{p.unitsSold30d}</span></span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="grid h-9 w-9 place-items-center rounded-full border border-gold/60 text-gold">
                      <span className="font-display text-xs font-bold">{p._s}</span>
                    </div>
                    <Link to="/" className="text-xs text-primary hover:underline">Analyze →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/60 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-3.5 w-3.5">{icon}</span>
        {label}
      </div>
      <div className={`mt-1 font-display text-xl font-bold ${accent ? "text-gold" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
