import { useCallback, useEffect, useState } from "react";
import { fetchAdminOverview } from "../services/analytics/adminIntel.js";

/**
 * @returns {{
 *   data: Record<string, unknown> | null,
 *   loading: boolean,
 *   error: string | null,
 *   refresh: () => void,
 * }}
 */
export function useAdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    setTick((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAdminOverview()
      .then((overview) => {
        if (cancelled) return;
        setData(overview);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setData(null);
        setError(e?.code === "NOT_ADMIN" ? "NOT_ADMIN" : e?.message || "Failed to load");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return { data, loading, error, refresh };
}
