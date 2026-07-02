/** Stable models only — preview IDs cause 404 storms on free tier. */
const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

export function geminiModelCandidates(): string[] {
  const env = Deno.env.get("GEMINI_MODEL");
  if (env) {
    return env.split(",").map((m) => m.trim()).filter(Boolean);
  }
  return DEFAULT_GEMINI_MODELS;
}

export type GeminiCallOpts = {
  prompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  useGoogleSearch?: boolean;
  latLng?: { latitude: number; longitude: number };
};

export type GeminiCallResult = { text: string; model: string; usedSearch: boolean };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * One Gemini call per attempt. On 429 we fail fast (no model cascade).
 * On 404 we try the next model. On 400 with search we retry once without search.
 */
export async function callGeminiWithFallback(
  geminiKey: string,
  opts: GeminiCallOpts,
): Promise<GeminiCallResult> {
  const models = geminiModelCandidates();
  const maxOutputTokens = opts.maxOutputTokens ?? 4096;
  const temperature = opts.temperature ?? 0.1;
  const wantSearch = opts.useGoogleSearch !== false;
  let lastErr = "gemini_all_models_failed";

  for (const model of models) {
    const searchAttempts = wantSearch ? [true, false] : [false];

    for (const useSearch of searchAttempts) {
      let retried503 = false;

      while (true) {
        const payload: Record<string, unknown> = {
          contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
          generationConfig: { maxOutputTokens, temperature },
        };

        if (useSearch) {
          payload.tools = [{ google_search: {} }];
          if (opts.latLng) {
            payload.toolConfig = {
              retrievalConfig: {
                latLng: {
                  latitude: opts.latLng.latitude,
                  longitude: opts.latLng.longitude,
                },
              },
            };
          }
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": geminiKey,
            },
            body: JSON.stringify(payload),
          },
        );

        const raw = await res.text();

        if (res.status === 429) {
          throw new Error(`gemini_429@${model}: rate limited — try again later`);
        }

        if (res.status === 401 || res.status === 403) {
          throw new Error(`gemini_${res.status}@${model}: ${raw.slice(0, 200)}`);
        }

        if (res.status === 503 && !retried503) {
          retried503 = true;
          await sleep(2000);
          continue;
        }

        if (res.ok) {
          const data = JSON.parse(raw);
          const parts = data?.candidates?.[0]?.content?.parts ?? [];
          const text = parts
            .filter((p: { text?: string }) => typeof p.text === "string")
            .map((p: { text: string }) => p.text)
            .join("\n")
            .trim();
          if (!text) {
            lastErr = `gemini_empty@${model}`;
            break;
          }
          return { text, model, usedSearch: useSearch };
        }

        lastErr = `gemini_${res.status}@${model}: ${raw.slice(0, 300)}`;

        if (res.status === 404) {
          break;
        }
        if (res.status === 400 && useSearch && wantSearch) {
          break;
        }
        break;
      }
    }
  }

  throw new Error(lastErr);
}
