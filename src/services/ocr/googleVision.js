const VISION_KEY = import.meta.env.VITE_GOOGLE_VISION_KEY || "";

export function isVisionConfigured() {
  return Boolean(VISION_KEY);
}

/**
 * @param {string} imageBase64 Raw base64 (no data-URL prefix)
 * @returns {Promise<string | null>}
 */
export async function recognizeWithVision(imageBase64) {
  if (!VISION_KEY || !imageBase64) return null;
  try {
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.responses?.[0]?.fullTextAnnotation?.text || null;
  } catch {
    return null;
  }
}
