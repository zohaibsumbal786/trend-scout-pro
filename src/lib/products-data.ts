// Curated realistic dropshipping product dataset.
// Compiled from publicly visible best-seller patterns across eBay/Amazon/AliExpress/Shopify
// (2024-2026). Swap for live API calls when ready — same shape.

export type Platform = "amazon" | "ebay" | "aliexpress" | "shopify";
export type Category =
  | "electronics"
  | "home"
  | "beauty"
  | "fitness"
  | "pets"
  | "fashion"
  | "kitchen"
  | "tech-accessories"
  | "outdoor"
  | "kids";

export interface Product {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  category: Category;
  platform: Platform;
  supplierPrice: number;   // AliExpress-style cost
  retailPrice: number;     // Avg selling price on retail platforms
  unitsSold30d: number;
  reviews: number;
  rating: number;          // 0-5
  trendScore: number;      // 0-100, search/social momentum
  competition: "low" | "medium" | "high";
  tags: string[];
}

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "electronics", label: "Electronics" },
  { value: "home", label: "Home & Decor" },
  { value: "beauty", label: "Beauty" },
  { value: "fitness", label: "Fitness" },
  { value: "pets", label: "Pets" },
  { value: "fashion", label: "Fashion" },
  { value: "kitchen", label: "Kitchen" },
  { value: "tech-accessories", label: "Tech Accessories" },
  { value: "outdoor", label: "Outdoor" },
  { value: "kids", label: "Kids & Toys" },
];

export const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: "amazon", label: "Amazon", color: "#FF9900" },
  { value: "ebay", label: "eBay", color: "#E53238" },
  { value: "aliexpress", label: "AliExpress", color: "#FF4747" },
  { value: "shopify", label: "Shopify", color: "#96BF48" },
];

const G = {
  emerald: "linear-gradient(135deg,#10b981,#064e3b)",
  amber: "linear-gradient(135deg,#f59e0b,#78350f)",
  rose: "linear-gradient(135deg,#f43f5e,#881337)",
  violet: "linear-gradient(135deg,#8b5cf6,#3b0764)",
  sky: "linear-gradient(135deg,#0ea5e9,#0c4a6e)",
  fuchsia: "linear-gradient(135deg,#d946ef,#581c87)",
  lime: "linear-gradient(135deg,#84cc16,#365314)",
  orange: "linear-gradient(135deg,#fb923c,#7c2d12)",
  teal: "linear-gradient(135deg,#14b8a6,#134e4a)",
  slate: "linear-gradient(135deg,#64748b,#0f172a)",
};

export const PRODUCTS: Product[] = [
  { id: "p001", title: "Mini Portable Neck Fan (Bladeless)", emoji: "🌀", gradient: G.sky, category: "electronics", platform: "amazon", supplierPrice: 4.20, retailPrice: 24.99, unitsSold30d: 8420, reviews: 12450, rating: 4.4, trendScore: 92, competition: "medium", tags: ["summer","viral-tiktok","gadget"] },
  { id: "p002", title: "Magnetic Phone Car Mount 360°", emoji: "📱", gradient: G.slate, category: "tech-accessories", platform: "aliexpress", supplierPrice: 1.80, retailPrice: 14.99, unitsSold30d: 15300, reviews: 28900, rating: 4.6, trendScore: 78, competition: "high", tags: ["evergreen","car"] },
  { id: "p003", title: "LED Galaxy Star Projector", emoji: "🌌", gradient: G.violet, category: "home", platform: "amazon", supplierPrice: 8.50, retailPrice: 39.99, unitsSold30d: 6120, reviews: 9870, rating: 4.5, trendScore: 88, competition: "medium", tags: ["bedroom","ambient","gift"] },
  { id: "p004", title: "Silicone Stretch Lids (12-Pack)", emoji: "🥣", gradient: G.lime, category: "kitchen", platform: "amazon", supplierPrice: 2.10, retailPrice: 16.99, unitsSold30d: 4520, reviews: 18200, rating: 4.7, trendScore: 65, competition: "high", tags: ["eco","reusable"] },
  { id: "p005", title: "Posture Corrector Back Brace", emoji: "🧘", gradient: G.teal, category: "fitness", platform: "shopify", supplierPrice: 3.40, retailPrice: 34.99, unitsSold30d: 3210, reviews: 4520, rating: 4.2, trendScore: 81, competition: "medium", tags: ["wellness","wfh"] },
  { id: "p006", title: "Self-Stirring Magnetic Mug", emoji: "☕", gradient: G.amber, category: "kitchen", platform: "ebay", supplierPrice: 3.90, retailPrice: 22.50, unitsSold30d: 2180, reviews: 1450, rating: 4.3, trendScore: 73, competition: "low", tags: ["novelty","gift"] },
  { id: "p007", title: "Pet Hair Remover Roller", emoji: "🐕", gradient: G.orange, category: "pets", platform: "amazon", supplierPrice: 2.60, retailPrice: 19.99, unitsSold30d: 11200, reviews: 32100, rating: 4.6, trendScore: 84, competition: "high", tags: ["evergreen","pet-owners"] },
  { id: "p008", title: "Jade Roller & Gua Sha Set", emoji: "💎", gradient: G.fuchsia, category: "beauty", platform: "aliexpress", supplierPrice: 1.50, retailPrice: 18.99, unitsSold30d: 5400, reviews: 7800, rating: 4.4, trendScore: 76, competition: "high", tags: ["skincare","viral"] },
  { id: "p009", title: "Smart LED Strip Lights 32ft", emoji: "💡", gradient: G.rose, category: "home", platform: "amazon", supplierPrice: 6.20, retailPrice: 29.99, unitsSold30d: 9800, reviews: 41200, rating: 4.5, trendScore: 86, competition: "high", tags: ["gen-z","gaming","bedroom"] },
  { id: "p010", title: "Resistance Bands Set (5-Level)", emoji: "💪", gradient: G.emerald, category: "fitness", platform: "amazon", supplierPrice: 3.10, retailPrice: 24.99, unitsSold30d: 7200, reviews: 22300, rating: 4.7, trendScore: 79, competition: "high", tags: ["home-gym","evergreen"] },
  { id: "p011", title: "Foldable Travel Garment Bag", emoji: "🧳", gradient: G.slate, category: "outdoor", platform: "shopify", supplierPrice: 7.80, retailPrice: 49.99, unitsSold30d: 1820, reviews: 2100, rating: 4.5, trendScore: 71, competition: "low", tags: ["travel","premium"] },
  { id: "p012", title: "Electric Pet Nail Grinder", emoji: "🐾", gradient: G.teal, category: "pets", platform: "amazon", supplierPrice: 5.40, retailPrice: 32.99, unitsSold30d: 4100, reviews: 11800, rating: 4.4, trendScore: 82, competition: "medium", tags: ["pet-care","grooming"] },
  { id: "p013", title: "Acupressure Mat & Pillow Set", emoji: "🪷", gradient: G.violet, category: "fitness", platform: "shopify", supplierPrice: 8.90, retailPrice: 54.99, unitsSold30d: 2900, reviews: 5400, rating: 4.6, trendScore: 87, competition: "low", tags: ["wellness","viral-tiktok"] },
  { id: "p014", title: "Heatless Hair Curler Rod", emoji: "💇", gradient: G.fuchsia, category: "beauty", platform: "aliexpress", supplierPrice: 1.20, retailPrice: 15.99, unitsSold30d: 8800, reviews: 14500, rating: 4.3, trendScore: 90, competition: "high", tags: ["viral-tiktok","beauty-hack"] },
  { id: "p015", title: "Mini Cordless Hand Vacuum", emoji: "🧹", gradient: G.sky, category: "home", platform: "amazon", supplierPrice: 9.50, retailPrice: 39.99, unitsSold30d: 3600, reviews: 8200, rating: 4.4, trendScore: 75, competition: "medium", tags: ["car","desk"] },
  { id: "p016", title: "Magnetic Eyelashes with Liner", emoji: "👁️", gradient: G.rose, category: "beauty", platform: "shopify", supplierPrice: 2.80, retailPrice: 26.99, unitsSold30d: 4700, reviews: 6900, rating: 4.2, trendScore: 80, competition: "high", tags: ["beauty","gift"] },
  { id: "p017", title: "Collapsible Silicone Dog Bowl", emoji: "🥗", gradient: G.lime, category: "pets", platform: "ebay", supplierPrice: 1.10, retailPrice: 9.99, unitsSold30d: 5200, reviews: 3400, rating: 4.6, trendScore: 68, competition: "medium", tags: ["travel","pet"] },
  { id: "p018", title: "Wireless Bluetooth Sleep Headband", emoji: "🎧", gradient: G.violet, category: "electronics", platform: "amazon", supplierPrice: 6.80, retailPrice: 34.99, unitsSold30d: 5900, reviews: 9100, rating: 4.3, trendScore: 85, competition: "medium", tags: ["sleep","wellness"] },
  { id: "p019", title: "Reusable Bamboo Cutlery Set", emoji: "🥢", gradient: G.lime, category: "kitchen", platform: "shopify", supplierPrice: 2.40, retailPrice: 17.99, unitsSold30d: 2300, reviews: 4100, rating: 4.5, trendScore: 60, competition: "low", tags: ["eco","travel"] },
  { id: "p020", title: "Anti-Snore Magnetic Nose Clip", emoji: "😴", gradient: G.sky, category: "beauty", platform: "aliexpress", supplierPrice: 0.40, retailPrice: 11.99, unitsSold30d: 6800, reviews: 5100, rating: 4.0, trendScore: 74, competition: "medium", tags: ["sleep","health"] },
  { id: "p021", title: "Car Headrest Phone Holder", emoji: "🚗", gradient: G.slate, category: "tech-accessories", platform: "amazon", supplierPrice: 2.90, retailPrice: 18.99, unitsSold30d: 4400, reviews: 7600, rating: 4.5, trendScore: 70, competition: "high", tags: ["family","road-trip"] },
  { id: "p022", title: "Portable Mini Sewing Machine", emoji: "🧵", gradient: G.amber, category: "home", platform: "ebay", supplierPrice: 8.20, retailPrice: 44.99, unitsSold30d: 1900, reviews: 2800, rating: 4.1, trendScore: 66, competition: "low", tags: ["diy","gift"] },
  { id: "p023", title: "Kids Magnetic Drawing Tablet", emoji: "🎨", gradient: G.fuchsia, category: "kids", platform: "amazon", supplierPrice: 4.10, retailPrice: 24.99, unitsSold30d: 7100, reviews: 18500, rating: 4.7, trendScore: 83, competition: "high", tags: ["kids","educational","gift"] },
  { id: "p024", title: "Solar-Powered Pathway Lights (8-Pack)", emoji: "🌞", gradient: G.amber, category: "outdoor", platform: "amazon", supplierPrice: 9.80, retailPrice: 42.99, unitsSold30d: 3800, reviews: 11200, rating: 4.4, trendScore: 77, competition: "high", tags: ["garden","seasonal"] },
  { id: "p025", title: "Massage Gun Mini Percussion", emoji: "🔫", gradient: G.rose, category: "fitness", platform: "shopify", supplierPrice: 11.50, retailPrice: 69.99, unitsSold30d: 2400, reviews: 3900, rating: 4.5, trendScore: 89, competition: "medium", tags: ["recovery","premium"] },
  { id: "p026", title: "Stainless Vegetable Chopper", emoji: "🔪", gradient: G.teal, category: "kitchen", platform: "amazon", supplierPrice: 5.90, retailPrice: 29.99, unitsSold30d: 6200, reviews: 24100, rating: 4.6, trendScore: 72, competition: "high", tags: ["meal-prep","kitchen-hack"] },
  { id: "p027", title: "Levitating Moon Lamp", emoji: "🌙", gradient: G.violet, category: "home", platform: "shopify", supplierPrice: 14.00, retailPrice: 79.99, unitsSold30d: 1500, reviews: 2200, rating: 4.4, trendScore: 84, competition: "low", tags: ["premium","gift","decor"] },
  { id: "p028", title: "Self-Cleaning Pet Slicker Brush", emoji: "🐈", gradient: G.orange, category: "pets", platform: "amazon", supplierPrice: 2.30, retailPrice: 16.99, unitsSold30d: 9300, reviews: 38400, rating: 4.7, trendScore: 80, competition: "high", tags: ["pet","grooming","evergreen"] },
  { id: "p029", title: "Foldable Solar Phone Charger 20W", emoji: "🔋", gradient: G.lime, category: "outdoor", platform: "aliexpress", supplierPrice: 7.50, retailPrice: 39.99, unitsSold30d: 2100, reviews: 1800, rating: 4.2, trendScore: 78, competition: "low", tags: ["camping","emergency"] },
  { id: "p030", title: "Silk Pillowcase (Mulberry)", emoji: "🛏️", gradient: G.fuchsia, category: "beauty", platform: "shopify", supplierPrice: 4.60, retailPrice: 32.99, unitsSold30d: 3700, reviews: 8800, rating: 4.6, trendScore: 82, competition: "medium", tags: ["skincare","haircare","gift"] },
  { id: "p031", title: "Mechanical RGB Gaming Keyboard", emoji: "⌨️", gradient: G.rose, category: "electronics", platform: "amazon", supplierPrice: 18.00, retailPrice: 64.99, unitsSold30d: 4800, reviews: 19300, rating: 4.5, trendScore: 76, competition: "high", tags: ["gaming","premium"] },
  { id: "p032", title: "Anti-Fatigue Kitchen Floor Mat", emoji: "🍳", gradient: G.amber, category: "kitchen", platform: "amazon", supplierPrice: 6.40, retailPrice: 36.99, unitsSold30d: 2700, reviews: 6100, rating: 4.5, trendScore: 64, competition: "medium", tags: ["home","comfort"] },
  { id: "p033", title: "Travel Compression Packing Cubes", emoji: "🎒", gradient: G.teal, category: "outdoor", platform: "amazon", supplierPrice: 5.20, retailPrice: 29.99, unitsSold30d: 5400, reviews: 14200, rating: 4.6, trendScore: 73, competition: "high", tags: ["travel","organization"] },
  { id: "p034", title: "Baby White Noise Sleep Sound Machine", emoji: "🍼", gradient: G.sky, category: "kids", platform: "amazon", supplierPrice: 8.10, retailPrice: 39.99, unitsSold30d: 4300, reviews: 10500, rating: 4.7, trendScore: 81, competition: "medium", tags: ["baby","parents","gift"] },
  { id: "p035", title: "Magnetic Window Cleaner Double-Side", emoji: "🪟", gradient: G.slate, category: "home", platform: "ebay", supplierPrice: 6.90, retailPrice: 34.99, unitsSold30d: 1600, reviews: 1900, rating: 4.2, trendScore: 67, competition: "low", tags: ["cleaning","gadget"] },
  { id: "p036", title: "Wide-Leg Lounge Pants (Unisex)", emoji: "👖", gradient: G.fuchsia, category: "fashion", platform: "shopify", supplierPrice: 4.80, retailPrice: 32.99, unitsSold30d: 6700, reviews: 5200, rating: 4.4, trendScore: 88, competition: "medium", tags: ["viral-tiktok","comfort"] },
  { id: "p037", title: "Mini Espresso Maker Portable", emoji: "☕", gradient: G.orange, category: "kitchen", platform: "shopify", supplierPrice: 12.50, retailPrice: 59.99, unitsSold30d: 2200, reviews: 3100, rating: 4.5, trendScore: 79, competition: "low", tags: ["travel","premium","gift"] },
  { id: "p038", title: "Pet GPS Tracker Mini Collar", emoji: "📍", gradient: G.emerald, category: "pets", platform: "amazon", supplierPrice: 7.20, retailPrice: 44.99, unitsSold30d: 3100, reviews: 5600, rating: 4.3, trendScore: 85, competition: "medium", tags: ["pet","safety","tech"] },
  { id: "p039", title: "Foldable Yoga Mat with Strap", emoji: "🧘‍♀️", gradient: G.lime, category: "fitness", platform: "amazon", supplierPrice: 6.80, retailPrice: 34.99, unitsSold30d: 4900, reviews: 12800, rating: 4.5, trendScore: 71, competition: "high", tags: ["yoga","wellness"] },
  { id: "p040", title: "Aurora Northern Lights Projector", emoji: "🌠", gradient: G.violet, category: "home", platform: "shopify", supplierPrice: 11.20, retailPrice: 54.99, unitsSold30d: 2800, reviews: 4400, rating: 4.5, trendScore: 91, competition: "low", tags: ["viral-tiktok","ambient","premium"] },
];

export function computeMargin(p: Product): number {
  return ((p.retailPrice - p.supplierPrice) / p.retailPrice) * 100;
}

export function computeProfit(p: Product): number {
  return p.retailPrice - p.supplierPrice;
}

/**
 * Composite "Winning Score" — combines profit margin, sales velocity, trend
 * momentum, rating, and inverse competition. 0–100.
 */
export function computeWinningScore(p: Product): number {
  const margin = computeMargin(p);                              // 0–100
  const marginScore = Math.min(100, margin);                    // already %
  const velocityScore = Math.min(100, (p.unitsSold30d / 150));  // 15k = 100
  const trendScore = p.trendScore;
  const ratingScore = (p.rating / 5) * 100;
  const compPenalty = p.competition === "low" ? 100 : p.competition === "medium" ? 75 : 50;

  return Math.round(
    marginScore * 0.30 +
    velocityScore * 0.20 +
    trendScore * 0.25 +
    ratingScore * 0.10 +
    compPenalty * 0.15,
  );
}
