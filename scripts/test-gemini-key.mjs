/**
 * Quick local test for Gemini API key + model availability.
 * Usage: GOOGLE_GEMINI_API_KEY=AQ.xxx node scripts/test-gemini-key.mjs
 */
const key = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
if (!key) {
  console.error("Set GOOGLE_GEMINI_API_KEY (your AQ. key from AI Studio)");
  process.exit(1);
}

const models = (process.env.GEMINI_MODEL || "gemini-2.5-flash,gemini-2.5-flash-lite,gemini-3-flash-preview")
  .split(",")
  .map((m) => m.trim());

const prompt = "Reply with one word: ok";

for (const model of models) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 16, temperature: 0 },
    }),
  });
  const body = await res.text();
  const status = res.ok ? "OK" : "FAIL";
  console.log(`${status} ${model} → HTTP ${res.status}`);
  if (!res.ok) console.log(body.slice(0, 280));
  else {
    try {
      const j = JSON.parse(body);
      const text = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      console.log(`  response: ${text.trim()}`);
    } catch {
      console.log(body.slice(0, 120));
    }
  }
}
