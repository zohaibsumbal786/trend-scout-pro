import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type HuntPlatform = "amazon" | "ebay" | "aliexpress" | "shopify";

const SITE_MAP: Record<HuntPlatform, string> = {
  amazon: "amazon.com",
  ebay: "ebay.com",
  aliexpress: "aliexpress.com",
  shopify: "myshopify.com OR shopify.com",
};

const Input = z.object({
  platform: z.enum(["amazon", "ebay", "aliexpress", "shopify"]),
  query: z.string().min(1).max(120),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  limit: z.number().min(1).max(20).default(10),
});

export type HuntResult = {
  platform: HuntPlatform;
  title: string;
  url: string;
  description: string;
  price: number | null;
  image: string | null;
};

function parsePrice(text: string): number | null {
  if (!text) return null;
  // Match $12.34 / £12 / €12,34 / 12.34 USD
  const m = text.match(/(?:US\$|USD\s?|\$|£|€)\s?(\d{1,5}(?:[.,]\d{1,2})?)/i);
  if (m) return Number(m[1].replace(",", "."));
  const m2 = text.match(/(\d{1,5}(?:\.\d{1,2})?)\s?(?:USD|usd)/);
  if (m2) return Number(m2[1]);
  return null;
}

function isProductUrl(platform: HuntPlatform, url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    const p = u.pathname.toLowerCase();
    switch (platform) {
      case "amazon":
        return h.includes("amazon.") && (/\/dp\/[a-z0-9]{6,}/i.test(p) || /\/gp\/product\//i.test(p));
      case "ebay":
        return h.includes("ebay.") && /\/itm\//i.test(p);
      case "aliexpress":
        return h.includes("aliexpress.") && /\/item\//i.test(p);
      case "shopify":
        return /\/products\//i.test(p) && !h.includes("amazon") && !h.includes("ebay") && !h.includes("aliexpress");
    }
  } catch {
    return false;
  }
  return false;
}

export const huntPlatform = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "FIRECRAWL_API_KEY missing", results: [] as HuntResult[] };
    }

    const site = SITE_MAP[data.platform];
    const priceHint =
      data.minPrice != null && data.maxPrice != null
        ? ` $${data.minPrice}-$${data.maxPrice}`
        : "";
    const query = `site:${site} ${data.query} best seller trending${priceHint}`;

    try {
      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const fc = new Firecrawl({ apiKey });
      const res = await fc.search(query, { limit: Math.min(data.limit * 2, 20) });

      const r = res as { web?: unknown[]; data?: unknown[] };
      const raw = ((r?.web ?? r?.data ?? []) as Array<{
        url?: string;
        title?: string;
        description?: string;
      }>);


      const results: HuntResult[] = [];
      for (const r of raw) {
        if (!r?.url || !r?.title) continue;
        if (!isProductUrl(data.platform, r.url)) continue;
        const price = parsePrice(`${r.title} ${r.description ?? ""}`);
        if (data.minPrice != null && price != null && price < data.minPrice) continue;
        if (data.maxPrice != null && price != null && price > data.maxPrice) continue;
        results.push({
          platform: data.platform,
          title: r.title.slice(0, 180),
          url: r.url,
          description: (r.description ?? "").slice(0, 240),
          price,
          image: null,
        });
        if (results.length >= data.limit) break;
      }

      return { ok: true as const, results };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Firecrawl error";
      return { ok: false as const, error: message, results: [] as HuntResult[] };
    }
  });
