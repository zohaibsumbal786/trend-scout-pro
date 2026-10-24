import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePriceAlerts } from "@/hooks/use-price-alerts";
import { useServerFn } from "@tanstack/react-start";
import { checkMyPrices } from "@/lib/price-watch.functions";
import { Bell, ExternalLink, Trash2, RefreshCw, CheckCheck, ArrowDownRight, Radar, Truck, Receipt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { HuntPlatform } from "@/lib/hunter.functions";
import { formatMoney } from "@/lib/normalize";


export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Price Drop Alerts | ProfitHunter" },
      {
        name: "description",
        content:
          "Get notified the moment your saved dropshipping products hit your target price across Amazon, eBay, AliExpress and Shopify.",
      },
    ],
  }),
  component: AlertsPage,
});

const PLATFORM_META: Record<HuntPlatform, { label: string; color: string }> = {
  amazon: { label: "Amazon", color: "#FF9900" },
  ebay: { label: "eBay", color: "#E53238" },
  aliexpress: { label: "AliExpress", color: "#FF4747" },
  shopify: { label: "Shopify", color: "#95BF47" },
};

function AlertsPage() {
  const { items, unreadCount, markRead, markAllRead, remove, clear } = usePriceAlerts();
  const run = useServerFn(checkMyPrices);
  const [running, setRunning] = useState(false);

  const checkNow = async () => {
    setRunning(true);
    try {
      const res = await run();
      if (!res.ok) {
        toast.error(res.error ?? "Price check failed");
      } else if (res.checked === 0) {
        toast(res.message ?? "Set a target price on a saved product first.");
      } else {
        toast.success(
          res.drops > 0
            ? `🎯 ${res.drops} new price drop${res.drops === 1 ? "" : "s"}!`
            : `Checked ${res.checked} product${res.checked === 1 ? "" : "s"} · no drops yet`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Price check failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto max-w-[1100px] px-4 pb-24 pt-8 lg:px-8">
        <section className="card-glass relative overflow-hidden rounded-2xl p-6 md:p-8">
          <div
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(circle at 80% 20%, #34d39955, transparent 60%)" }}
          />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface/60 px-3 py-1 text-xs">
                <Bell className="h-3.5 w-3.5 text-primary" /> Price drop radar
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">
                Price <span className="text-gradient-primary">alerts</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                We re-scan the live listings for your saved products and fire an alert the moment
                a price drops to (or below) your target.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="outline" className="border-primary/60 text-primary">
                  {unreadCount} unread
                </Badge>
              )}
              <Button
                onClick={checkNow}
                disabled={running}
                className="bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} />
                {running ? "Checking…" : "Check prices now"}
              </Button>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={() => markAllRead()}>
                  <CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all read
                </Button>
              )}
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete all alerts?")) clear();
                  }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <div className="card-glass mt-6 grid place-items-center rounded-2xl p-16 text-center">
            <Bell className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-semibold">No price alerts yet</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Open a saved product, set a target price you'd buy at, then hit "Check prices now".
              We'll log every drop here and update live across all your devices.
            </p>
            <div className="mt-5 flex gap-2">
              <Link to="/saved">
                <Button variant="outline">Open saved</Button>
              </Link>
              <Link to="/hunt">
                <Button className="bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90">
                  <Radar className="mr-2 h-4 w-4" /> Run the Hunter
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((a) => {
              const p = PLATFORM_META[a.platform];
              const dropPct =
                a.oldPrice != null && a.oldPrice > 0
                  ? ((a.oldPrice - a.newPrice) / a.oldPrice) * 100
                  : null;
              const unread = !a.readAt;
              return (
                <li
                  key={a.id}
                  className={`card-glass flex flex-col gap-3 rounded-xl p-4 transition md:flex-row md:items-center ${
                    unread ? "ring-1 ring-primary/40" : ""
                  }`}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="uppercase tracking-wider text-muted-foreground">{p.label}</span>
                      {unread && (
                        <span className="rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
                          NEW
                        </span>
                      )}
                      <span className="ml-auto text-muted-foreground/70">
                        {new Date(a.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => unread && markRead(a.id)}
                      className="group line-clamp-2 text-sm font-semibold leading-snug hover:text-primary"
                    >
                      {a.title}
                      <ExternalLink className="ml-1 inline h-3 w-3 align-baseline text-muted-foreground group-hover:text-primary" />
                    </a>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-mono text-base font-bold text-primary">
                        {formatMoney(a.newPrice, a.currency)}
                      </span>
                      {a.oldPrice != null && (
                        <span className="font-mono text-muted-foreground line-through">
                          {formatMoney(a.oldPrice, a.currency)}
                        </span>
                      )}
                      {dropPct != null && dropPct > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
                          <ArrowDownRight className="h-3 w-3" />
                          {dropPct.toFixed(0)}% off
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        target {formatMoney(a.targetPrice, a.currency)} landed
                      </span>
                    </div>
                    {(a.rawNewPrice != null || (a.shippingUsd ?? 0) > 0 || (a.taxUsd ?? 0) > 0) && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        {a.rawNewPrice != null && (
                          <span className="font-mono">
                            listed ${a.rawNewPrice.toFixed(2)}
                            <span className="ml-1 opacity-70">source</span>
                          </span>
                        )}
                        {(a.shippingUsd ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Truck className="h-3 w-3" /> +${a.shippingUsd!.toFixed(2)} ship
                          </span>
                        )}
                        {(a.taxUsd ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Receipt className="h-3 w-3" /> +${a.taxUsd!.toFixed(2)} tax
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {unread && (
                      <Button size="sm" variant="outline" onClick={() => markRead(a.id)}>
                        Mark read
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
                      aria-label="Delete alert"
                      className="grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-surface/60 text-muted-foreground hover:border-destructive/60 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
