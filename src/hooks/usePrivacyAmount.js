import { useCallback } from "react";
import { useNetWorth } from "../context/NetWorthContext.jsx";
import { formatPrivateInr } from "../constants/symbols.js";

/** Privacy-aware amount formatting — use anywhere amounts are shown. */
export function usePrivacyAmount() {
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const formatAmount = useCallback(
    (amount, mask = "••••") => formatPrivateInr(privacyMode, amount, mask),
    [privacyMode],
  );
  const formatScore = useCallback(
    (score, mask = "•••") => (privacyMode ? mask : String(Math.round(Number(score) || 0))),
    [privacyMode],
  );
  return { privacyMode, togglePrivacyMode, formatAmount, formatScore };
}
