import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  computeLanded,
  DEFAULT_PREFS,
  parsePriceWithCurrency,
  type PricingPrefs,
} from "@/lib/normalize";
import type { HuntPlatform } from "@/lib/hunter.functions";

// ---------- Target price ----------

const SetTargetInput = z.object({
  savedProductId: z.string().uuid(),
  targetPrice: z.number().min(0).max(1_000_000).nullable(),
});

export const setTargetPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SetTargetInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("saved_products")
      .update({ target_price: data.targetPrice })
      .eq("id", data.savedProductId)
      .eq("user_id", context.userId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ---------- Pricing preferences (home currency, tax, shipping) ----------

const PrefsInput = z.object({
  homeCurrency: z.string().min(3).max(6),
  taxRatePct: z.number().min(0).max(100),
  includeShipping: z.boolean(),
  defaultShippingUsd: z.number().min(0).max(1000),
});

type PrefsRow = {
  home_currency: string;
  tax_rate_pct: number | string;
  include_shipping: boolean;
  default_shipping_usd: number | string;
};

export const getPricingPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PricingPrefs> => {
    const { data } = await context.supabase
      .from("user_pricing_prefs")
      .select("home_currency, tax_rate_pct, include_shipping, default_shipping_usd")
      .eq("user_id", context.userId)
      .maybeSingle();
    const row = data as PrefsRow | null;
    if (!row) return DEFAULT_PREFS;
    return {
      homeCurrency: row.home_currency ?? "USD",
      taxRatePct: Number(row.tax_rate_pct ?? 0),
      includeShipping: !!row.include_shipping,
      defaultShippingUsd: Number(row.default_shipping_usd ?? 0),
    };
  });

export const savePricingPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PrefsInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("user_pricing_prefs").upsert(
      {
        user_id: context.userId,
        home_currency: data.homeCurrency.toUpperCase(),
        tax_rate_pct: data.taxRatePct,
        include_shipping: data.includeShipping,
        default_shipping_usd: data.defaultShippingUsd,
      },
      { onConflict: "user_id" },
    );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ---------- Price checker ----------

type SavedRow = {
  id: string;
  product_url: string;
  platform: string;
  title: string;
  price: number | string | null;
  source_currency: string | null;
  target_price: number | string | null;
  last_known_price: number | string | null;
  last_known_currency: string | null;
};

export const checkMyPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Price checker is not configured.", checked: 0, drops: 0 };
    }

    // Load user prefs (home currency, tax, shipping).
    const { data: prefsRow } = await context.supabase
      .from("user_pricing_prefs")
      .select("home_currency, tax_rate_pct, include_shipping, default_shipping_usd")
      .eq("user_id", context.userId)
      .maybeSingle();
    const p = prefsRow as PrefsRow | null;
    const prefs: PricingPrefs = p
      ? {
          homeCurrency: p.home_currency ?? "USD",
          taxRatePct: Number(p.tax_rate_pct ?? 0),
          includeShipping: !!p.include_shipping,
          defaultShippingUsd: Number(p.default_shipping_usd ?? 0),
        }
      : DEFAULT_PREFS;

    const { data: rows, error } = await context.supabase
      .from("saved_products")
      .select(
        "id, product_url, platform, title, price, source_currency, target_price, last_known_price, last_known_currency",
      )
      .eq("user_id", context.userId)
      .not("target_price", "is", null)
      .limit(8);

    if (error) return { ok: false as const, error: error.message, checked: 0, drops: 0 };
    const watched = (rows ?? []) as SavedRow[];
    if (watched.length === 0) {
      return {
        ok: true as const,
        checked: 0,
        drops: 0,
        message: "Set a target price on a saved product first.",
      };
    }

    const { default: Firecrawl } = await import("@mendable/firecrawl-js");
    const fc = new Firecrawl({ apiKey });

    let drops = 0;
    let checked = 0;

    for (const row of watched) {
      const target = row.target_price == null ? null : Number(row.target_price);
      if (target == null || !Number.isFinite(target)) continue;

      let parsed: { amount: number; currency: string } | null = null;
      try {
        const res = (await fc.scrape(row.product_url, {
          formats: ["markdown"],
          onlyMainContent: true,
        })) as { markdown?: string; metadata?: { description?: string; title?: string } };
        const text = `${res?.metadata?.title ?? ""} ${res?.metadata?.description ?? ""} ${res?.markdown ?? ""}`.slice(
          0,
          8000,
        );
        parsed = parsePriceWithCurrency(text);
      } catch {
        parsed = null;
      }

      checked += 1;
      const nowIso = new Date().toISOString();

      if (parsed == null) {
        await context.supabase
          .from("saved_products")
          .update({ last_checked_at: nowIso })
          .eq("id", row.id)
          .eq("user_id", context.userId);
        continue;
      }

      const platform = row.platform as HuntPlatform;
      const breakdown = computeLanded({
        price: parsed.amount,
        currency: parsed.currency,
        platform,
        prefs,
      });

      // Previous landed price (in home currency) for delta display.
      let previousLandedHome: number | null = null;
      if (row.last_known_price != null && row.last_known_currency) {
        // last_known_price is already stored in home currency (landed).
        previousLandedHome = Number(row.last_known_price);
      } else if (row.price != null && row.source_currency) {
        previousLandedHome = computeLanded({
          price: Number(row.price),
          currency: row.source_currency,
          platform,
          prefs,
        }).landedHome;
      }

      await context.supabase
        .from("saved_products")
        .update({
          last_checked_at: nowIso,
          last_known_price: breakdown.landedHome,
          last_known_currency: prefs.homeCurrency,
          last_known_raw_price: parsed.amount,
          last_known_shipping_usd: breakdown.shippingUsd,
          last_known_tax_usd: breakdown.taxUsd,
          source_currency: row.source_currency ?? parsed.currency,
        })
        .eq("id", row.id)
        .eq("user_id", context.userId);

      // Compare landed cost (home currency) with the user's target.
      if (breakdown.landedHome <= target) {
        const { data: recent } = await context.supabase
          .from("price_alerts")
          .select("id, new_price, created_at")
          .eq("user_id", context.userId)
          .eq("saved_product_id", row.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const last = recent?.[0] as
          | { new_price: number | string; created_at: string }
          | undefined;
        const isDuplicate =
          last &&
          Number(last.new_price) === breakdown.landedHome &&
          Date.now() - new Date(last.created_at).getTime() < 1000 * 60 * 60 * 12;

        if (!isDuplicate) {
          await context.supabase.from("price_alerts").insert({
            user_id: context.userId,
            saved_product_id: row.id,
            product_url: row.product_url,
            title: row.title,
            platform: row.platform,
            old_price: previousLandedHome,
            new_price: breakdown.landedHome,
            target_price: target,
            currency: prefs.homeCurrency,
            raw_new_price: parsed.amount,
            shipping_usd: breakdown.shippingUsd,
            tax_usd: breakdown.taxUsd,
          });
          drops += 1;
        }
      }
    }

    return { ok: true as const, checked, drops };
  });
