import { getSupabaseClient } from "./supabase/auth.js";
import { invokeEdgeFunction } from "./supabase/invokeEdgeFunction.js";

const API_PROXY_FUNCTION = "api-proxy";

/** @returns {boolean} */
export function isApiProxyAvailable() {
  return Boolean(getSupabaseClient());
}

/**
 * @param {Record<string, unknown>} body
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function invokeApiProxy(body) {
  const { data, error } = await invokeEdgeFunction(API_PROXY_FUNCTION, { body });
  if (error) return { error };
  return data;
}
