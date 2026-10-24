// Cross-region price normalization utilities.
// Pure functions (no server-only imports) so both client and server code can use them.

import type { HuntPlatform } from "@/lib/hunter.functions";

/**
 * Approximate FX rates → USD. Static table — good enough for compare / target
 * alerts, not for accounting. Update periodically or wire to a live feed.
 */
export const FX_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  CAD: 0.74,
  AUD: 0.66,
  NZD: 0.61,
  JPY: 0.0064,
  CNY: 0.14,
  HKD: 0.128,
  SGD: 0.74,
  INR: 0.012,
  KRW: 0.00072,
  MXN: 0.055,
  BRL: 0.19,
  ZAR: 0.054,
  SEK: 0.094,
  NOK: 0.093,
  DKK: 0.145,
  CHF: 1.13,
  PLN: 0.25,
  TRY: 0.029,
  AED: 0.272,
  SAR: 0.267,
};

export const CURRENCY_LABEL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  NZD: "NZ$",
  JPY: "¥",
  CNY: "¥",
  HKD: "HK$",
  SGD: "S$",
  INR: "₹",
  KRW: "₩",
  MXN: "MX$",
  BRL: "R$",
  ZAR: "R",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  CHF: "CHF",
  PLN: "zł",
  TRY: "₺",
  AED: "AED",
  SAR: "SAR",
};

// Order matters: match multi-char tokens before single-char.
const CURRENCY_TOKENS: [string, string][] = [
  ["US$", "USD"],
  ["USD", "USD"],
  ["CA$", "CAD"],
  ["C$", "CAD"],
  ["CAD", "CAD"],
  ["AU$", "AUD"],
  ["A$", "AUD"],
  ["AUD", "AUD"],
  ["NZ$", "NZD"],
  ["NZD", "NZD"],
  ["HK$", "HKD"],
  ["HKD", "HKD"],
  ["S$", "SGD"],
  ["SGD", "SGD"],
  ["MX$", "MXN"],
  ["MXN", "MXN"],
  ["R$", "BRL"],
  ["BRL", "BRL"],
  ["EUR", "EUR"],
  ["GBP", "GBP"],
  ["JPY", "JPY"],
  ["CNY", "CNY"],
  ["RMB", "CNY"],
  ["INR", "INR"],
  ["KRW", "KRW"],
  ["SEK", "SEK"],
  ["NOK", "NOK"],
  ["DKK", "DKK"],
  ["CHF", "CHF"],
  ["PLN", "PLN"],
  ["TRY", "TRY"],
  ["AED", "AED"],
  ["SAR", "SAR"],
  ["ZAR", "ZAR"],
  ["£", "GBP"],
  ["€", "EUR"],
  ["¥", "JPY"], // ambiguous with CNY; JPY wins by default
  ["₹", "INR"],
  ["₩", "KRW"],
  ["₺", "TRY"],
  ["zł", "PLN"],
  ["kr", "SEK"], // ambiguous with NOK/DKK; SEK by default
  ["$", "USD"],
];

export type ParsedPrice = {
  amount: number;
  currency: string;
};

/**
 * Extract the best-guess sale price + currency from arbitrary marketplace text
 * (scraped markdown / title / description). Returns the smallest sane price on
 * the page (usually the sale price), tagged with the currency token found next
 * to it. If no currency token is found, we return null so callers can decide.
 */
export function parsePriceWithCurrency(text: string): ParsedPrice | null {
  if (!text) return null;
  const src = text.replace(/\s+/g, " ");
  const candidates: ParsedPrice[] = [];

  for (const [token, code] of CURRENCY_TOKENS) {
    // Escape regex specials in the token.
    const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match: TOKEN followed by amount, OR amount followed by TOKEN.
    const re = new RegExp(
      `(?:${esc})\\s?(\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)|(\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)\\s?(?:${esc})`,
      "gi",
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      const raw = (m[1] ?? m[2] ?? "").trim();
      const amt = normalizeNumericString(raw);
      if (Number.isFinite(amt) && amt > 0 && amt < 1_000_000) {
        candidates.push({ amount: amt, currency: code });
      }
    }
  }

  if (candidates.length === 0) return null;
  // Prefer the smallest price found (usually the current/sale price).
  candidates.sort((a, b) => a.amount - b.amount);
  return candidates[0];
}

function normalizeNumericString(s: string): number {
  // Handle both "1,299.99" (US) and "1.299,99" (EU).
  const commas = (s.match(/,/g) ?? []).length;
  const dots = (s.match(/\./g) ?? []).length;
  let cleaned = s;
  if (commas > 0 && dots > 0) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      // EU format: dots = thousands, comma = decimal
      cleaned = s.replace(/\./g, "").replace(",", ".");
    } else {
      // US format: commas = thousands, dot = decimal
      cleaned = s.replace(/,/g, "");
    }
  } else if (commas > 0 && dots === 0) {
    // Ambiguous. Treat trailing ",dd" as decimal, otherwise thousands.
    if (/,\d{1,2}$/.test(s)) cleaned = s.replace(/\./g, "").replace(",", ".");
    else cleaned = s.replace(/,/g, "");
  } else {
    cleaned = s.replace(/,/g, "");
  }
  return Number(cleaned);
}

export function toUsd(amount: number, currency: string): number {
  const rate = FX_TO_USD[currency.toUpperCase()] ?? 1;
  return amount * rate;
}

export function convert(amount: number, from: string, to: string): number {
  const usd = toUsd(amount, from);
  const toRate = FX_TO_USD[to.toUpperCase()] ?? 1;
  if (toRate === 0) return usd;
  return usd / toRate;
}

/** Rough per-platform shipping fallback in USD when the listing doesn't
 * expose a shipping cost we can parse. Users can override globally in prefs. */
export const PLATFORM_SHIPPING_USD: Record<HuntPlatform, number> = {
  amazon: 0, // typically Prime / free
  ebay: 0, // typically free shipping on trending items
  aliexpress: 3,
  shopify: 5,
};

export type PricingPrefs = {
  homeCurrency: string;
  taxRatePct: number; // 0-100
  includeShipping: boolean;
  defaultShippingUsd: number; // overrides platform default when > 0
};

export const DEFAULT_PREFS: PricingPrefs = {
  homeCurrency: "USD",
  taxRatePct: 0,
  includeShipping: true,
  defaultShippingUsd: 0,
};

export type LandedBreakdown = {
  itemUsd: number;
  shippingUsd: number;
  taxUsd: number;
  landedUsd: number;
  landedHome: number;
  homeCurrency: string;
  sourceCurrency: string;
  fxRateToHome: number;
};

/**
 * Compute the true landed cost of a listing in the user's home currency,
 * accounting for FX, shipping and tax so target-price comparisons are apples
 * to apples across regions.
 */
export function computeLanded(input: {
  price: number;
  currency: string;
  platform: HuntPlatform;
  prefs?: Partial<PricingPrefs>;
}): LandedBreakdown {
  const prefs = { ...DEFAULT_PREFS, ...(input.prefs ?? {}) };
  const itemUsd = toUsd(input.price, input.currency);
  const shippingUsd = prefs.includeShipping
    ? prefs.defaultShippingUsd > 0
      ? prefs.defaultShippingUsd
      : PLATFORM_SHIPPING_USD[input.platform] ?? 0
    : 0;
  const taxable = itemUsd + shippingUsd;
  const taxUsd = taxable * (Math.max(0, prefs.taxRatePct) / 100);
  const landedUsd = itemUsd + shippingUsd + taxUsd;
  const toHomeRate = FX_TO_USD[prefs.homeCurrency.toUpperCase()] ?? 1;
  const landedHome = toHomeRate === 0 ? landedUsd : landedUsd / toHomeRate;
  return {
    itemUsd: round(itemUsd),
    shippingUsd: round(shippingUsd),
    taxUsd: round(taxUsd),
    landedUsd: round(landedUsd),
    landedHome: round(landedHome),
    homeCurrency: prefs.homeCurrency.toUpperCase(),
    sourceCurrency: input.currency.toUpperCase(),
    fxRateToHome: toHomeRate,
  };
}

function round(n: number, digits = 2): number {
  const m = 10 ** digits;
  return Math.round(n * m) / m;
}

export function formatMoney(amount: number, currency: string): string {
  const code = currency.toUpperCase();
  const symbol = CURRENCY_LABEL[code] ?? "";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${symbol}${amount.toFixed(2)}`;
  }
}

export const SUPPORTED_CURRENCIES: string[] = Object.keys(FX_TO_USD);
