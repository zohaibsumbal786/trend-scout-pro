import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  PRODUCTS,
  CATEGORIES,
  PLATFORMS,
  computeMargin,
  computeProfit,
  computeWinningScore,
  type Product,
  type Platform,
  type Category,
} from "@/lib/products-data";
import { analyzeProduct } from "@/lib/products.functions";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Sparkles, TrendingUp, Flame, Crown, Search, ShoppingBag, BarChart3, Target, Loader2, Radar, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProfitHunter — Find Winning Dropshipping Products" },
      { name: "description", content: "Hunt trending high-margin products across Amazon, eBay, AliExpress, and Shopify. AI-powered winning-product scores, profit calculator, and trend signals." },
      { property: "og:title", content: "ProfitHunter — Winning Product Finder" },
      { property: "og:description", content: "Hunt trending high-margin products across Amazon, eBay, AliExpress & Shopify with AI scoring." },
    ],
  }),
  component: Dashboard,
});

type SortKey = "winning" | "margin" | "trend" | "sales" | "price-low" | "price-high";

function Dashboard() {
  const [query, setQuery] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(PLATFORMS.map((p) => p.value));
  const [category, setCategory] = useState<Category | "all">("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [minMargin, setMinMargin] = useState(0);
  const [sort, setSort] = useState<SortKey>("winning");
  const [selected, setSelected] = useState<Product | null>(null);

  const enriched = useMemo(
    () => PRODUCTS.map((p) => ({ ...p, _margin: computeMargin(p), _profit: computeProfit(p), _score: computeWinningScore(p) })),
    [],
  );

  const filtered = useMemo(() => {
    let list = enriched.filter((p) => {
      if (!platforms.includes(p.platform)) return false;
      if (category !== "all" && p.category !== category) return false;
      if (p.retailPrice < priceRange[0] || p.retailPrice > priceRange[1]) return false;
      if (p._margin < minMargin) return false;
      if (query && !p.title.toLowerCase().includes(query.toLowerCase()) && !p.tags.some((t) => t.includes(query.toLowerCase()))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "winning": return b._score - a._score;
        case "margin": return b._margin - a._margin;
        case "trend": return b.trendScore - a.trendScore;
        case "sales": return b.unitsSold30d - a.unitsSold30d;
        case "price-low": return a.retailPrice - b.retailPrice;
        case "price-high": return b.retailPrice - a.retailPrice;
      }
    });
    return list;
  }, [enriched, platforms, category, priceRange, minMargin, query, sort]);

  const stats = useMemo(() => {
    const count = filtered.length;
    const avgMargin = count ? filtered.reduce((s, p) => s + p._margin, 0) / count : 0;
    const hot = filtered.filter((p) => p._score >= 75).length;
    const avgProfit = count ? filtered.reduce((s, p) => s + p._profit, 0) / count : 0;
    return { count, avgMargin, hot, avgProfit };
  }, [filtered]);

  const togglePlatform = (p: Platform) =>
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pb-24 pt-8 lg:px-8">
        <Hero />
        <StatsBar count={stats.count} avgMargin={stats.avgMargin} hot={stats.hot} avgProfit={stats.avgProfit} />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <FiltersPanel
            query={query} setQuery={setQuery}
            platforms={platforms} togglePlatform={togglePlatform}
            category={category} setCategory={setCategory}
            priceRange={priceRange} setPriceRange={setPriceRange}
            minMargin={minMargin} setMinMargin={setMinMargin}
            sort={sort} setSort={setSort}
          />
          <ResultsGrid products={filtered} onSelect={setSelected} />
        </div>
      </main>
      <AnalysisDrawer product={selected} onClose={() => setSelected(null)} />
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        ProfitHunter · curated dataset · swap <code className="rounded bg-surface px-1.5 py-0.5">src/lib/products-data.ts</code> for live API feeds when ready
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="mb-10">
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-gold" />
          AI-powered winning score · cross-platform margin analysis
        </div>
        <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Hunt <span className="text-gradient-primary">winning products</span><br />
          before your competitors do.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Filter trending products across Amazon, eBay, AliExpress, and Shopify by category, price, and minimum profit margin — then get an AI verdict on each one.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Link to="/hunt" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-gold px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90">
            <Zap className="h-4 w-4" /> Run the live hunter
          </Link>
          {PLATFORMS.map((p) => (
            <Link
              key={p.value}
              to="/store/$platform"
              params={{ platform: p.value }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label} store
            </Link>
          ))}
          <span className="ml-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Radar className="h-3 w-3" /> real-time scan across 4 marketplaces
          </span>
        </div>
      </div>
    </section>
  );
}

function StatsBar({ count, avgMargin, hot, avgProfit }: { count: number; avgMargin: number; hot: number; avgProfit: number }) {
  const items = [
    { icon: ShoppingBag, label: "Products matched", value: count.toString(), tint: "text-foreground" },
    { icon: BarChart3, label: "Avg margin", value: `${avgMargin.toFixed(1)}%`, tint: "text-primary" },
    { icon: TrendingUp, label: "Avg profit / unit", value: `$${avgProfit.toFixed(2)}`, tint: "text-primary" },
    { icon: Flame, label: "Hot picks (score 75+)", value: hot.toString(), tint: "text-gold" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </div>
          <div className={`mt-2 font-display text-2xl font-bold ${s.tint}`}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

interface FiltersProps {
  query: string; setQuery: (v: string) => void;
  platforms: Platform[]; togglePlatform: (p: Platform) => void;
  category: Category | "all"; setCategory: (c: Category | "all") => void;
  priceRange: [number, number]; setPriceRange: (r: [number, number]) => void;
  minMargin: number; setMinMargin: (n: number) => void;
  sort: SortKey; setSort: (s: SortKey) => void;
}

function FiltersPanel(p: FiltersProps) {
  return (
    <aside className="card-glass sticky top-24 h-fit rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold">Hunt filters</h2>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={p.query} onChange={(e) => p.setQuery(e.target.value)} placeholder="product or tag…" className="pl-9" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Platforms</label>
          <div className="space-y-2">
            {PLATFORMS.map((pl) => (
              <label key={pl.value} className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-surface/60 px-3 py-2 transition hover:bg-surface-elevated">
                <Checkbox checked={p.platforms.includes(pl.value)} onCheckedChange={() => p.togglePlatform(pl.value)} />
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pl.color }}></span>
                <span className="text-sm">{pl.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Category</label>
          <Select value={p.category} onValueChange={(v) => p.setCategory(v as Category | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Retail price</label>
            <span className="font-mono text-xs text-foreground">${p.priceRange[0]}–${p.priceRange[1]}</span>
          </div>
          <Slider min={0} max={100} step={5} value={p.priceRange} onValueChange={(v) => p.setPriceRange([v[0], v[1]] as [number, number])} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Min margin</label>
            <span className="font-mono text-xs text-primary">{p.minMargin}%</span>
          </div>
          <Slider min={0} max={95} step={5} value={[p.minMargin]} onValueChange={(v) => p.setMinMargin(v[0])} />
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Sort by</label>
          <Select value={p.sort} onValueChange={(v) => p.setSort(v as SortKey)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="winning">🏆 Winning score</SelectItem>
              <SelectItem value="margin">💰 Highest margin</SelectItem>
              <SelectItem value="trend">🔥 Trend momentum</SelectItem>
              <SelectItem value="sales">📈 Most sales</SelectItem>
              <SelectItem value="price-low">↑ Price: low to high</SelectItem>
              <SelectItem value="price-high">↓ Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </aside>
  );
}

type EnrichedProduct = Product & { _margin: number; _profit: number; _score: number };

function ResultsGrid({ products, onSelect }: { products: EnrichedProduct[]; onSelect: (p: Product) => void }) {
  if (products.length === 0) {
    return (
      <div className="card-glass grid place-items-center rounded-2xl p-16 text-center">
        <div className="text-5xl">🎯</div>
        <h3 className="mt-4 font-display text-xl font-semibold">No matches</h3>
        <p className="mt-1 text-sm text-muted-foreground">Loosen your filters to see more winning products.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => <ProductCard key={p.id} product={p} onSelect={onSelect} />)}
    </div>
  );
}

function ProductCard({ product, onSelect }: { product: EnrichedProduct; onSelect: (p: Product) => void }) {
  const platform = PLATFORMS.find((pl) => pl.value === product.platform)!;
  const scoreColor = product._score >= 80 ? "text-gold" : product._score >= 65 ? "text-primary" : "text-muted-foreground";
  const scoreRing = product._score >= 80 ? "glow-gold" : product._score >= 65 ? "glow-primary" : "";

  return (
    <article className="card-glass group flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-0.5">
      <div className="relative h-40 overflow-hidden" style={{ background: product.gradient }}>
        <div className="absolute inset-0 grid place-items-center text-7xl opacity-90 transition group-hover:scale-110">
          {product.emoji}
        </div>
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Badge variant="outline" className="border-white/30 bg-black/40 text-white backdrop-blur">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platform.color }} />
            {platform.label}
          </Badge>
        </div>
        {product._score >= 80 && (
          <div className="absolute right-3 top-3">
            <Badge className="border-0 bg-gold text-gold-foreground">
              <Crown className="mr-1 h-3 w-3" /> Winning
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.8em] text-sm font-semibold leading-snug">{product.title}</h3>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-surface/80 p-2">
            <div className="text-muted-foreground">Supplier</div>
            <div className="font-mono text-sm font-semibold">${product.supplierPrice.toFixed(2)}</div>
          </div>
          <div className="rounded-lg bg-surface/80 p-2">
            <div className="text-muted-foreground">Retail</div>
            <div className="font-mono text-sm font-semibold">${product.retailPrice.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
          <span className="text-xs text-muted-foreground">Profit / unit</span>
          <span className="font-mono text-sm font-bold text-primary">
            +${product._profit.toFixed(2)} · {product._margin.toFixed(0)}%
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <Stat label="Trend" value={`${product.trendScore}`} />
          <Stat label="Sold 30d" value={fmtK(product.unitsSold30d)} />
          <Stat label="Rating" value={`★${product.rating}`} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {product.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-secondary-foreground">#{t}</span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <div className="flex items-center gap-2">
            <div className={`grid h-10 w-10 place-items-center rounded-full border border-current ${scoreColor} ${scoreRing}`}>
              <span className="font-display text-sm font-bold">{product._score}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Winning<br/>score</div>
          </div>
          <Button size="sm" onClick={() => onSelect(product)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Analyze
          </Button>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface/60 py-1.5">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold text-foreground">{value}</div>
    </div>
  );
}

function fmtK(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function AnalysisDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const analyze = useServerFn(analyzeProduct);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset when product changes
  useMemo(() => { setResult(null); setError(null); }, [product?.id]);

  if (!product) return null;
  const margin = computeMargin(product);
  const profit = computeProfit(product);
  const score = computeWinningScore(product);
  const platform = PLATFORMS.find((pl) => pl.value === product.platform)!;

  const runAnalysis = async () => {
    setLoading(true); setError(null);
    try {
      const res = await analyze({
        data: {
          productId: product.id, title: product.title, category: product.category,
          platform: product.platform, supplierPrice: product.supplierPrice,
          retailPrice: product.retailPrice, margin, unitsSold30d: product.unitsSold30d,
          trendScore: product.trendScore, rating: product.rating,
          competition: product.competition, tags: product.tags,
        },
      });
      if (res.ok) setResult(res.analysis);
      else setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto bg-background sm:max-w-xl">
        <SheetHeader>
          <div className="h-40 w-full overflow-hidden rounded-xl" style={{ background: product.gradient }}>
            <div className="grid h-full place-items-center text-7xl">{product.emoji}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline"><span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platform.color }} />{platform.label}</Badge>
            <Badge variant="outline">{product.category}</Badge>
            <Badge variant="outline" className={product.competition === "low" ? "border-primary/60 text-primary" : product.competition === "high" ? "border-destructive/60 text-destructive" : ""}>
              {product.competition} competition
            </Badge>
          </div>
          <SheetTitle className="mt-1 font-display text-xl">{product.title}</SheetTitle>
          <SheetDescription>Cross-platform winning-product breakdown</SheetDescription>
        </SheetHeader>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <KPI label="Margin" value={`${margin.toFixed(0)}%`} accent="primary" />
          <KPI label="Profit/unit" value={`$${profit.toFixed(2)}`} accent="primary" />
          <KPI label="Score" value={`${score}`} accent={score >= 80 ? "gold" : "primary"} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Row label="Supplier price" value={`$${product.supplierPrice.toFixed(2)}`} />
          <Row label="Retail price" value={`$${product.retailPrice.toFixed(2)}`} />
          <Row label="Units sold (30d)" value={product.unitsSold30d.toLocaleString()} />
          <Row label="Trend score" value={`${product.trendScore}/100`} />
          <Row label="Reviews" value={product.reviews.toLocaleString()} />
          <Row label="Rating" value={`${product.rating} / 5`} />
        </div>

        <div className="mt-6">
          {!result && !loading && (
            <Button onClick={runAnalysis} size="lg" className="w-full bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" /> Generate AI Verdict
            </Button>
          )}
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface/60 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing market fit & angle…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}
          {result && (
            <div className="card-glass mt-2 rounded-xl p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
                <Sparkles className="h-3.5 w-3.5" /> AI Verdict
              </div>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {result}
              </div>
              <Button variant="ghost" size="sm" onClick={runAnalysis} className="mt-3">Regenerate</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent: "primary" | "gold" }) {
  const tint = accent === "gold" ? "text-gold" : "text-primary";
  return (
    <div className="card-glass rounded-xl p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-xl font-bold ${tint}`}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface/60 px-3 py-2 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">{value}</span>
    </div>
  );
}
