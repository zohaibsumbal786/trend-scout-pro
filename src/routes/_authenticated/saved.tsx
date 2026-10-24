import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSavedProducts, type SavedProduct } from "@/hooks/use-saved-products";
import { usePricingPrefs } from "@/hooks/use-pricing-prefs";
import {
  Bookmark,
  Trash2,
  ExternalLink,
  GitCompareArrows,
  X,
  Search,
  Radar,
  Crown,
  Target,
  Bell,
  RefreshCw,
  Settings2,
  Globe2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { HuntPlatform } from "@/lib/hunter.functions";
import { useServerFn } from "@tanstack/react-start";
import { setTargetPrice, checkMyPrices } from "@/lib/price-watch.functions";
import { toast } from "sonner";
import {
  CURRENCY_LABEL,
  SUPPORTED_CURRENCIES,
  computeLanded,
  formatMoney,
  type PricingPrefs,
} from "@/lib/normalize";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved Products & Comparison | ProfitHunter" },
      {
        name: "description",
        content:
          "Track winning dropshipping products across Amazon, eBay, AliExpress and Shopify. Compare up to four side-by-side on price, margin and profit potential.",
      },
    ],
  }),
  component: SavedPage,
});

const PLATFORM_META: Record<HuntPlatform, { label: string; color: string }> = {
  amazon: { label: "Amazon", color: "#FF9900" },
  ebay: { label: "eBay", color: "#E53238" },
  aliexpress: { label: "AliExpress", color: "#FF4747" },
  shopify: { label: "Shopify", color: "#95BF47" },
};

const SUGGESTED_MARGIN = 2.4;
const MAX_COMPARE = 4;

function SavedPage() {
  const { items, remove, clear } = useSavedProducts();
  const { prefs, save: savePrefs } = usePricingPrefs();
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<HuntPlatform | "all">("all");
  const [selected, setSelected] = useState<string[]>([]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (platformFilter !== "all" && it.platform !== platformFilter) return false;
      if (!q) return true;
      return (
        it.title.toLowerCase().includes(q) ||
        it.description.toLowerCase().includes(q) ||
        it.query.toLowerCase().includes(q)
      );
    });
  }, [items, query, platformFilter]);

  const compareItems = useMemo(
    () => selected.map((id) => items.find((i) => i.id === id)).filter(Boolean) as SavedProduct[],
    [selected, items],
  );

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= MAX_COMPARE) return [...s.slice(1), id];
      return [...s, id];
    });
  };

  const platformCounts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const it of items) c[it.platform] = (c[it.platform] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1500px] px-4 pb-24 pt-8 lg:px-8">
        <section className="card-glass relative overflow-hidden rounded-2xl p-6 md:p-8">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(circle at 70% 20%, #facc1555, transparent 60%)" }}
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs">
                <Bookmark className="h-3.5 w-3.5 text-gold" /> Your shortlist
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                Saved <span className="text-gradient-primary">products</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Track products across every marketplace, set a target price, and get a price-drop
                alert the moment the live listing matches it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-gold/60 text-gold">
                {items.length} saved
              </Badge>
              <Link to="/alerts">
                <Button variant="outline" size="sm">
                  <Bell className="mr-1.5 h-3.5 w-3.5" /> Alerts
                </Button>
              </Link>
              <CheckAllPricesButton hasWatched={items.some((i) => i.targetPrice != null)} />
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Clear all saved products?")) {
                      clear();
                      setSelected([]);
                    }
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear all
                </Button>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="relative mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your saved products…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {(["all", "amazon", "ebay", "aliexpress", "shopify"] as const).map((p) => {
                  const active = platformFilter === p;
                  const label =
                    p === "all" ? "All" : PLATFORM_META[p as HuntPlatform].label;
                  const color = p === "all" ? undefined : PLATFORM_META[p as HuntPlatform].color;
                  const count = platformCounts[p] ?? 0;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlatformFilter(p)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
                        active
                          ? "border-primary/60 bg-primary/10 text-foreground"
                          : "border-border/60 bg-surface/40 text-muted-foreground"
                      }`}
                    >
                      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
                      {label}
                      <span className="text-[10px] opacity-70">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <PricingPrefsPanel prefs={prefs} onSave={savePrefs} />

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  {filtered.length === items.length
                    ? "All saved"
                    : `${filtered.length} match${filtered.length === 1 ? "" : "es"}`}
                </h2>
                <span className="text-xs text-muted-foreground">
                  Select up to {MAX_COMPARE} to compare
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="card-glass grid place-items-center rounded-2xl p-12 text-center text-sm text-muted-foreground">
                  No saved products match this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filtered.map((it) => (
                    <SavedCard
                      key={it.id}
                      item={it}
                      prefs={prefs}
                      selected={selected.includes(it.id)}
                      onToggleSelect={() => toggleSelect(it.id)}
                      onRemove={() => {
                        remove(it.id);
                        setSelected((s) => s.filter((x) => x !== it.id));
                      }}
                    />
                  ))}
                </div>
              )}
            </section>

            <aside className="card-glass h-fit rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <GitCompareArrows className="h-3.5 w-3.5 text-primary" /> Comparison
                </div>
                {compareItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected([])}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
              {compareItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Tap the compare icon on any saved product to add it here. Compare up to {MAX_COMPARE} side-by-side.
                </p>
              ) : (
                <CompareList items={compareItems} onRemove={(id) => toggleSelect(id)} />
              )}
            </aside>
          </div>
        )}

        {compareItems.length >= 2 && <CompareTable items={compareItems} />}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-glass mt-6 grid place-items-center rounded-2xl p-16 text-center">
      <Bookmark className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 font-display text-xl font-semibold">No saved products yet</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Run the hunter, find winning products, and tap the bookmark icon to save them here for comparison.
      </p>
      <Link to="/hunt" className="mt-5">
        <Button className="bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90">
          <Radar className="mr-2 h-4 w-4" /> Run the Hunter
        </Button>
      </Link>
    </div>
  );
}

function SavedCard({
  item,
  prefs,
  selected,
  onToggleSelect,
  onRemove,
}: {
  item: SavedProduct;
  prefs: PricingPrefs;
  selected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}) {
  const platform = PLATFORM_META[item.platform];
  const sourceCcy = item.sourceCurrency ?? "USD";
  const landed =
    item.price != null
      ? computeLanded({ price: item.price, currency: sourceCcy, platform: item.platform, prefs })
      : null;
  const estRetail = landed ? landed.landedHome * SUGGESTED_MARGIN : null;
  const profit = landed && estRetail != null ? estRetail - landed.landedHome : null;
  const homeSym = CURRENCY_LABEL[prefs.homeCurrency] ?? prefs.homeCurrency;

  return (
    <div
      className={`card-glass group relative flex flex-col gap-2 rounded-xl p-3 transition ${
        selected ? "ring-2 ring-primary/60" : ""
      }`}
    >
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? "Remove from compare" : "Add to compare"}
          className={`grid h-7 w-7 place-items-center rounded-full border transition ${
            selected
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border/60 bg-surface/80 text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitCompareArrows className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove from saved"
          className="grid h-7 w-7 place-items-center rounded-full border border-border/60 bg-surface/80 text-muted-foreground transition hover:border-destructive/60 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 pr-16">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platform.color }} />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {platform.label}
          </span>
          {sourceCcy !== prefs.homeCurrency && (
            <span className="rounded bg-surface/70 px-1 text-[9px] text-muted-foreground">
              {sourceCcy} → {prefs.homeCurrency}
            </span>
          )}
          <ExternalLink className="h-3 w-3 text-muted-foreground transition group-hover:text-primary" />
        </div>
        <div className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {item.price != null ? (
            <>
              <span className="font-mono font-semibold text-foreground">
                {formatMoney(item.price, sourceCcy)}
              </span>
              {landed && (
                <span
                  className="font-mono text-muted-foreground"
                  title={`Item ${formatMoney(landed.itemUsd, "USD")} + shipping ${formatMoney(
                    landed.shippingUsd,
                    "USD",
                  )} + tax ${formatMoney(landed.taxUsd, "USD")}`}
                >
                  landed {formatMoney(landed.landedHome, prefs.homeCurrency)}
                </span>
              )}
              {profit != null && (
                <span className="font-mono text-primary">
                  +{formatMoney(profit, prefs.homeCurrency)} est.
                </span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">Price on listing</span>
          )}
          {item.lastKnownPrice != null && landed && item.lastKnownPrice !== landed.landedHome && (
            <span
              className={`font-mono ${
                item.lastKnownPrice < landed.landedHome ? "text-primary" : "text-muted-foreground"
              }`}
            >
              live {formatMoney(item.lastKnownPrice, item.lastKnownCurrency ?? prefs.homeCurrency)}
            </span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/70">
            from "{item.query}" · {new Date(item.savedAt).toLocaleDateString()}
          </span>
        </div>
      </a>
      <TargetPriceRow item={item} landedHome={landed?.landedHome ?? null} homeSymbol={homeSym} homeCurrency={prefs.homeCurrency} />
    </div>
  );
}

function TargetPriceRow({
  item,
  landedHome,
  homeSymbol,
  homeCurrency,
}: {
  item: SavedProduct;
  landedHome: number | null;
  homeSymbol: string;
  homeCurrency: string;
}) {
  const setTarget = useServerFn(setTargetPrice);
  const [value, setValue] = useState<string>(item.targetPrice != null ? String(item.targetPrice) : "");
  const [saving, setSaving] = useState(false);

  const dirty = (item.targetPrice != null ? String(item.targetPrice) : "") !== value;
  const currentLanded = item.lastKnownPrice ?? landedHome ?? Infinity;
  const met = item.targetPrice != null && currentLanded <= item.targetPrice;

  const save = async () => {
    const parsed = value.trim() === "" ? null : Number(value);
    if (parsed != null && (!Number.isFinite(parsed) || parsed < 0)) {
      toast.error("Enter a valid target price");
      return;
    }
    setSaving(true);
    try {
      const res = await setTarget({ data: { savedProductId: item.id, targetPrice: parsed } });
      if (!res.ok) toast.error(res.error ?? "Could not save target");
      else
        toast.success(
          parsed == null ? "Target removed" : `Target set at ${homeSymbol}${parsed.toFixed(2)} ${homeCurrency} landed`,
        );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save target");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`mt-1 flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] ${
        met
          ? "border-primary/50 bg-primary/10"
          : item.targetPrice != null
            ? "border-gold/40 bg-gold/5"
            : "border-border/60 bg-surface/40"
      }`}
      title={`Alert fires when the landed cost (item + shipping + tax, converted to ${homeCurrency}) reaches your target.`}
    >
      <Target
        className={`h-3.5 w-3.5 ${
          met ? "text-primary" : item.targetPrice != null ? "text-gold" : "text-muted-foreground"
        }`}
      />
      <span className="text-muted-foreground">Alert at</span>
      <span className="text-muted-foreground">{homeSymbol}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="—"
        className="w-16 bg-transparent font-mono text-foreground outline-none placeholder:text-muted-foreground/50"
      />
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
        {homeCurrency} landed
      </span>
      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="ml-auto rounded bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary disabled:opacity-40"
      >
        {saving ? "…" : "Save"}
      </button>
      {met && (
        <span className="rounded bg-primary/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
          Hit
        </span>
      )}
    </div>
  );
}

function PricingPrefsPanel({
  prefs,
  onSave,
}: {
  prefs: PricingPrefs;
  onSave: (next: PricingPrefs) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PricingPrefs>(prefs);
  const [saving, setSaving] = useState(false);

  // Keep draft in sync when prefs load.
  useMemo(() => setDraft(prefs), [prefs]);

  const dirty =
    draft.homeCurrency !== prefs.homeCurrency ||
    draft.taxRatePct !== prefs.taxRatePct ||
    draft.includeShipping !== prefs.includeShipping ||
    draft.defaultShippingUsd !== prefs.defaultShippingUsd;

  const commit = async () => {
    setSaving(true);
    try {
      const res = await onSave(draft);
      if (!res.ok) toast.error(res.error ?? "Could not save preferences");
      else toast.success("Pricing preferences saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card-glass mt-6 rounded-2xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-semibold">Pricing normalization</span>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">
            <Globe2 className="mr-1 inline h-3 w-3" /> home {prefs.homeCurrency} · tax{" "}
            {prefs.taxRatePct}% · shipping {prefs.includeShipping ? "on" : "off"}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{open ? "Hide" : "Edit"}</span>
      </button>

      {open && (
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="uppercase tracking-wider text-muted-foreground">Home currency</span>
            <select
              value={draft.homeCurrency}
              onChange={(e) => setDraft({ ...draft, homeCurrency: e.target.value })}
              className="rounded border border-border/60 bg-surface/60 px-2 py-1.5 text-sm outline-none"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} ({CURRENCY_LABEL[c] ?? ""})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="uppercase tracking-wider text-muted-foreground">
              Sales tax / VAT %
            </span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={draft.taxRatePct}
              onChange={(e) =>
                setDraft({ ...draft, taxRatePct: Math.max(0, Number(e.target.value) || 0) })
              }
              className="rounded border border-border/60 bg-surface/60 px-2 py-1.5 font-mono text-sm outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="uppercase tracking-wider text-muted-foreground">
              Shipping override (USD)
            </span>
            <input
              type="number"
              min="0"
              step="0.5"
              value={draft.defaultShippingUsd}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  defaultShippingUsd: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="rounded border border-border/60 bg-surface/60 px-2 py-1.5 font-mono text-sm outline-none"
              placeholder="0 = platform default"
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            <span className="uppercase tracking-wider text-muted-foreground">
              Include shipping in landed cost
            </span>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="pp-inc-ship"
                type="checkbox"
                checked={draft.includeShipping}
                onChange={(e) => setDraft({ ...draft, includeShipping: e.target.checked })}
                className="h-4 w-4 accent-primary"
              />
              <label htmlFor="pp-inc-ship" className="text-xs text-muted-foreground">
                Add estimated shipping to the landed cost
              </label>
            </div>
          </label>
          <div className="md:col-span-4 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
            <span>
              Targets compare against{" "}
              <span className="font-mono text-foreground">item + shipping + tax</span> converted to{" "}
              <span className="font-mono text-foreground">{draft.homeCurrency}</span>.
            </span>
            <Button size="sm" onClick={commit} disabled={!dirty || saving}>
              {saving ? "Saving…" : "Save preferences"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}


function CheckAllPricesButton({ hasWatched }: { hasWatched: boolean }) {
  const run = useServerFn(checkMyPrices);
  const [busy, setBusy] = useState(false);
  const onClick = async () => {
    if (!hasWatched) {
      toast("Set a target price on a saved product first.");
      return;
    }
    setBusy(true);
    try {
      const res = await run();
      if (!res.ok) toast.error(res.error ?? "Price check failed");
      else if (res.checked === 0) toast(res.message ?? "Nothing to check.");
      else
        toast.success(
          res.drops > 0
            ? `🎯 ${res.drops} price drop${res.drops === 1 ? "" : "s"} found!`
            : `Checked ${res.checked} · no drops yet`,
        );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Price check failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={busy}
      className="bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90"
    >
      <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      {busy ? "Checking…" : "Check prices"}
    </Button>
  );
}

function CompareList({
  items,
  onRemove,
}: {
  items: SavedProduct[];
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => {
        const platform = PLATFORM_META[it.platform];
        return (
          <li
            key={it.id}
            className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface/40 p-2"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: platform.color }} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {platform.label}
                </span>
              </div>
              <div className="line-clamp-1 text-xs font-medium">{it.title}</div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(it.id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove from comparison"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CompareTable({ items }: { items: SavedProduct[] }) {
  // Determine "best" per row
  const prices = items.map((i) => i.price ?? Infinity);
  const minPrice = Math.min(...prices);
  const profits = items.map((i) =>
    i.price != null ? i.price * SUGGESTED_MARGIN - i.price : -Infinity,
  );
  const maxProfit = Math.max(...profits);

  const cellCls = "px-3 py-3 align-top text-sm";
  const headCls =
    "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

  return (
    <section className="card-glass mt-8 overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-gold" />
          <h2 className="font-display text-base font-semibold">Side-by-side comparison</h2>
        </div>
        <Badge variant="outline" className="border-primary/60 text-primary">
          {items.length} products
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-surface/40">
            <tr>
              <th className={headCls}>Metric</th>
              {items.map((it, i) => (
                <th key={it.id} className={headCls}>
                  Product {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr>
              <td className={`${cellCls} font-medium`}>Marketplace</td>
              {items.map((it) => {
                const p = PLATFORM_META[it.platform];
                return (
                  <td key={it.id} className={cellCls}>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </div>
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Title</td>
              {items.map((it) => (
                <td key={it.id} className={cellCls}>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-1.5 font-medium hover:text-primary"
                  >
                    <span className="line-clamp-3">{it.title}</span>
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                  </a>
                </td>
              ))}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Listed price</td>
              {items.map((it) => {
                const isBest = it.price != null && it.price === minPrice;
                return (
                  <td key={it.id} className={cellCls}>
                    {it.price != null ? (
                      <span
                        className={`font-mono font-semibold ${
                          isBest ? "text-primary" : "text-foreground"
                        }`}
                      >
                        ${it.price.toFixed(2)}
                        {isBest && (
                          <span className="ml-1 rounded bg-primary/20 px-1 text-[9px] uppercase tracking-wider">
                            cheapest
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Est. resell (×{SUGGESTED_MARGIN})</td>
              {items.map((it) => (
                <td key={it.id} className={cellCls}>
                  {it.price != null ? (
                    <span className="font-mono text-foreground">
                      ${(it.price * SUGGESTED_MARGIN).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Est. profit / unit</td>
              {items.map((it, i) => {
                const prof = profits[i];
                const isBest = prof === maxProfit && prof > -Infinity;
                return (
                  <td key={it.id} className={cellCls}>
                    {prof > -Infinity ? (
                      <span
                        className={`font-mono font-semibold ${
                          isBest ? "text-gold" : "text-foreground"
                        }`}
                      >
                        +${prof.toFixed(2)}
                        {isBest && (
                          <span className="ml-1 rounded bg-gold/20 px-1 text-[9px] uppercase tracking-wider text-gold">
                            best
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Est. margin</td>
              {items.map((it) => (
                <td key={it.id} className={cellCls}>
                  {it.price != null ? (
                    <span className="font-mono text-foreground">
                      {(((SUGGESTED_MARGIN - 1) / SUGGESTED_MARGIN) * 100).toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Description</td>
              {items.map((it) => (
                <td key={it.id} className={`${cellCls} text-xs text-muted-foreground`}>
                  <span className="line-clamp-4">{it.description || "—"}</span>
                </td>
              ))}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Found via</td>
              {items.map((it) => (
                <td key={it.id} className={`${cellCls} text-xs text-muted-foreground`}>
                  "{it.query}"
                  <div className="text-[10px]">
                    {new Date(it.savedAt).toLocaleDateString()}
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td className={`${cellCls} font-medium`}>Link</td>
              {items.map((it) => (
                <td key={it.id} className={cellCls}>
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Open listing <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
