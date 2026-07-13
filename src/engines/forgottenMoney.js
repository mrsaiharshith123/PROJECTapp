/**
 * "Did you have an EPF account from a job before this one?" — a gentle,
 * periodic prompt (never more than once per interval) pointing at a real,
 * common source of forgotten money. Small effort, potentially recovers
 * real money — one of the strongest trust-building moments an app can
 * create, per RBI/EPFO's own reporting of large unclaimed-deposit totals.
 * @param {object} settings
 * @param {string} settings.userMode
 * @param {number} [settings.forgottenMoneyLastPromptedAt] ms epoch
 * @param {boolean} [settings.forgottenMoneyDismissed]
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} wealthEntries
 * @param {number} [now]
 * @param {number} [intervalDays]
 */
export function shouldPromptForgottenEpf(settings, wealthEntries, now = Date.now(), intervalDays = 120) {
  if (settings?.forgottenMoneyDismissed) return false;
  // Already tracking an EPF entry — the nudge exists to surface a MISSING
  // one, not to pester someone who's already on top of it. Still worth a
  // once-ever check since people often forget an OLD employer's EPF even
  // while tracking their current one.
  const hasAnyEpf = (wealthEntries || []).some((e) => e.categoryId === "pf_epf" && !e.hidden);
  const lastPrompted = Number(settings?.forgottenMoneyLastPromptedAt) || 0;
  const daysSincePrompt = lastPrompted > 0 ? (now - lastPrompted) / 86400000 : Infinity;

  if (lastPrompted === 0) return true; // never asked
  if (hasAnyEpf) return false; // already have at least one — the once-ever ask already served its purpose once ack'd
  return daysSincePrompt >= intervalDays;
}
