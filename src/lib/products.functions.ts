import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const AnalyzeInput = z.object({
  productId: z.string(),
  title: z.string(),
  category: z.string(),
  platform: z.string(),
  supplierPrice: z.number(),
  retailPrice: z.number(),
  margin: z.number(),
  unitsSold30d: z.number(),
  trendScore: z.number(),
  rating: z.number(),
  competition: z.string(),
  tags: z.array(z.string()),
});

export const analyzeProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY missing");

    const { createAiProvider } = await import("./ai-gateway.server");
    const gateway = createAiProvider(apiKey);

    const prompt = `You are an elite e-commerce / dropshipping product analyst. Give a sharp, concrete verdict on this product. Be specific, not generic.

Product: ${data.title}
Category: ${data.category}
Platform sourced from: ${data.platform}
Supplier cost: $${data.supplierPrice}
Retail price: $${data.retailPrice}
Gross margin: ${data.margin.toFixed(1)}%
Units sold (30d): ${data.unitsSold30d.toLocaleString()}
Trend momentum: ${data.trendScore}/100
Customer rating: ${data.rating}/5
Competition level: ${data.competition}
Tags: ${data.tags.join(", ")}

Respond in this exact markdown format:

### Verdict
One-line buy/skip recommendation with confidence.

### Why it works
- 2-3 punchy bullets, each ≤ 15 words.

### Risks
- 1-2 honest risks, ≤ 15 words each.

### Winning angle
One sentence: which audience + which hook (e.g. TikTok demo, problem-solution ad, gift bundle).

### Suggested ad creative
One concrete hook line you could literally use in a Facebook/TikTok ad.`;

    try {
      const { text } = await generateText({
        model: gateway("gpt-4o-mini"),
        prompt,
      });
      return { ok: true as const, analysis: text };
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI unavailable";
      return { ok: false as const, error: message };
    }
  });
