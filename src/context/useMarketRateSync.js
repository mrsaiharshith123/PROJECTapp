import { useCallback, useEffect, useMemo, useRef } from "react";
import { fetchFundNav } from "../services/market/amfiNav.js";
import {
  fetchGoldPricePerGram,
  isGoldApiConfigured,
  shouldRefreshGoldRate,
} from "../services/market/goldPrice.js";
import { applyGoldRateToWealth } from "../utils/netWorth/goldRateSync.js";

/**
 * Keeps externally-sourced valuation data fresh: today's gold rate (for
 * gold wealth entries) and mutual fund NAVs (for SIP/MF commitments with a
 * schemeCode). Both are "check once per day, refresh on tab-visible" style
 * background syncs — grouped here since they're the same kind of concern
 * (market data staleness), not because they share implementation.
 *
 * @param {object} deps
 * @param {import('react').RefObject<any>} deps.settingsRef
 * @param {(updater: any) => void} deps.persistSettings
 * @param {any[]} deps.commitments
 * @param {string} deps.todayStr
 * @param {import('react').RefObject<(id: any, patch: any) => void>} deps.updateCommitmentRef
 */
export function useMarketRateSync({ settingsRef, persistSettings, commitments, todayStr, updateCommitmentRef }) {
  const refreshGoldRate = useCallback(
    async (options = {}) => {
      const force = Boolean(options.force);
      if (!isGoldApiConfigured()) return false;
      const s = settingsRef.current;
      if (!force && !shouldRefreshGoldRate(s.goldRateLastFetched, s.goldRatePerGram)) {
        return Number(s.goldRatePerGram) > 0;
      }
      const result = await fetchGoldPricePerGram();
      if (!result) return false;
      persistSettings((prev) => ({
        ...prev,
        goldRatePerGram: result.perGram,
        goldRateLastFetched: result.date,
      }));
      applyGoldRateToWealth(Number(result.perGram));
      return true;
    },
    [settingsRef, persistSettings]
  );

  useEffect(() => {
    if (!isGoldApiConfigured()) return;
    refreshGoldRate();
  }, [refreshGoldRate]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const s = settingsRef.current;
      if (!shouldRefreshGoldRate(s.goldRateLastFetched, s.goldRatePerGram)) return;
      refreshGoldRate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshGoldRate, settingsRef]);

  const commitmentsRef = useRef(commitments);
  useEffect(() => {
    commitmentsRef.current = commitments;
  }, [commitments]);

  const navStaleSig = useMemo(
    () =>
      commitments
        .filter((c) => {
          if (!c.schemeCode) return false;
          const fetched = c.navFetchedAt ? String(c.navFetchedAt).slice(0, 10) : "";
          return fetched !== todayStr;
        })
        .map((c) => String(c.id))
        .sort()
        .join(","),
    [commitments, todayStr]
  );

  const navRefreshRef = useRef({ sig: "", inFlight: false });

  useEffect(() => {
    if (!navStaleSig) {
      navRefreshRef.current = { sig: "", inFlight: false };
      return;
    }
    if (navRefreshRef.current.inFlight && navRefreshRef.current.sig === navStaleSig) return;

    navRefreshRef.current = { sig: navStaleSig, inFlight: true };
    let cancelled = false;
    const ids = navStaleSig.split(",").filter(Boolean);

    (async () => {
      try {
        for (const id of ids) {
          const c = commitmentsRef.current.find((row) => String(row.id) === id);
          if (!c?.schemeCode) continue;
          const fetched = c.navFetchedAt ? String(c.navFetchedAt).slice(0, 10) : "";
          if (fetched === todayStr) continue;
          const nav = await fetchFundNav(c.schemeCode);
          if (cancelled || !nav) continue;
          updateCommitmentRef.current(c.id, { currentNav: nav.nav, navFetchedAt: todayStr });
        }
      } finally {
        if (!cancelled) navRefreshRef.current.inFlight = false;
      }
    })();

    return () => {
      cancelled = true;
      navRefreshRef.current.inFlight = false;
    };
  }, [navStaleSig, todayStr, updateCommitmentRef]);

  return { refreshGoldRate };
}
