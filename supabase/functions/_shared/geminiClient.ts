/** Models tried in order — override with GEMINI_MODEL=gemini-2.5-flash,gemini-3-flash-preview */
const DEFAULT_GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
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

/**
 * Call Gemini REST API with x-goog-api-key header (required for AQ. auth keys)
 * and fall through models on 404.
 */
export async function callGeminiWithFallback(
  geminiKey: string,
  opts: GeminiCallOpts,
): Promise<GeminiCallResult> {
  const models = geminiModelCandidates();
  const maxOutputTokens = opts.maxOutputTokens ?? (opts.useGoogleSearch !== false ? 8192 : 2000);
  const temperature = opts.temperature ?? 0.1;
  const wantSearch = opts.useGoogleSearch !== false;
  const searchModes = wantSearch ? [true, false] : [false];
  let lastErr = "gemini_all_models_failed";

  for (const model of models) {
    for (const useSearch of searchModes) {
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
          continue;
        }
        return { text, model, usedSearch: useSearch };
      }

      lastErr = `gemini_${res.status}@${model}: ${raw.slice(0, 400)}`;

      if (res.status === 401 || res.status === 403) {
        throw new Error(lastErr);
      }
      if (res.status === 404) {
        break;
      }
      if (res.status === 400 && useSearch) {
        continue;
      }
      if (!useSearch) {
        break;
      }
    }
  }

  throw new Error(lastErr);
}
