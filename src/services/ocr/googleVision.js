import { invokeApiProxy, isApiProxyAvailable } from "../apiProxy.js";

export function isVisionConfigured() {
  return isApiProxyAvailable();
}

/**
 * @param {string} imageBase64 Raw base64 (no data-URL prefix)
 * @returns {Promise<string | null>}
 */
export async function recognizeWithVision(imageBase64) {
  if (!isVisionConfigured() || !imageBase64) return null;
  const data = await invokeApiProxy({ service: "vision-ocr", imageBase64 });
  if (!data || data.error) return null;
  return data.text ? String(data.text) : null;
}
