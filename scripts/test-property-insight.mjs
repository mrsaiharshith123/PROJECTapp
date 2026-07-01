/**
 * Test full edge-function property prompt.
 */
import { readFileSync } from "fs";

const key = process.env.GOOGLE_GEMINI_API_KEY;
if (!key) process.exit(1);

const body = {
  categoryId: "property_residential",
  location: "Srinagar Colony, Nakkala Gutta, Hanamkonda",
  latitude: 18.01024,
  longitude: 79.54276,
  areaMeasure: 253,
  areaUnit: "sqyd",
  purchaseYear: 1985,
  purchasePrice: 7590,
  currentValue: 145464,
};

// mirror buildPropertyPrompt from index.ts
const coords = `GPS pin: ${body.latitude}, ${body.longitude}`;
const loc = `${body.location} · ${coords}`;
const prompt = `You are a real estate analyst for Indian property markets with Google Search access.

Search Google NOW for CURRENT 2026 property prices:
- "${body.location} property price per sqyard 2026"
- "${body.location} plot rate per sqyard Hanamkonda Warangal 2026"
- "${body.location} real estate market 2026"
- "Vaddepally Road 100 feet road property rate Hanamkonda 2026"

Property details:
- Type: residential property
- Location: ${loc}
- Area: ${body.areaMeasure} ${body.areaUnit}
- Purchase year: ${body.purchaseYear}
- Purchase price: ₹7,590
- User's current estimate: ₹1,45,464 (auto-calculated — NOT real market value)

IMPORTANT: Search for the ACTUAL current market rate per sqyard in this specific locality.
Factor in road-facing premium, colony tier, and recent registry/listing prices.
Do NOT use generic city-tier CAGR averages.

After searching, respond ONLY with valid JSON (no markdown, no extra text):
{
  "marketRate": {
    "perSqyd": <number REQUIRED — never null>,
    "perSqft": null,
    "unit": "sqyd",
    "rangeMin": <lower bound>,
    "rangeMax": <upper bound>,
    "confidence": "high" | "medium" | "low",
    "dataSource": "<source>"
  },
  "impliedMarketValue": <perSqyd * 253>,
  "valuationGap": <implied - 145464>,
  "trend": { "direction": "rising", "annualGrowthPct": 8, "description": "..." },
  "developments": ["..."],
  "holdRecommendation": { "verdict": "hold", "horizon": "5y", "specificReason": "..." },
  "riskFactors": ["..."],
  "bestExitWindow": "2028-2030",
  "summary": "<2 sentences max>"
}`;

function extractJson(raw) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON");
  return JSON.parse(candidate.slice(start, end + 1));
}

const res = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      toolConfig: {
        retrievalConfig: { latLng: { latitude: body.latitude, longitude: body.longitude } },
      },
      generationConfig: { maxOutputTokens: 8192, temperature: 0.1 },
    }),
  },
);

const raw = await res.text();
const data = JSON.parse(raw);
console.log("finish:", data?.candidates?.[0]?.finishReason);
const parts = data?.candidates?.[0]?.content?.parts ?? [];
console.log("parts count:", parts.length);
const text = parts.filter((p) => p.text).map((p) => p.text).join("\n") ?? "";
console.log("chars:", text.length);
console.log(text);
try {
  const j = extractJson(text);
  console.log("\nperSqyd:", j.marketRate?.perSqyd, "implied:", j.impliedMarketValue);
} catch (e) {
  console.log("\nPARSE FAIL:", e.message);
}
