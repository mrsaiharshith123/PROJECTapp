import { format } from "date-fns";
import { computeNetWorthCore } from "../engines/netWorth/core.js";
import { filterWealthByProfile } from "./netWorth/wealthStorage.js";
import { accountOriginDayKey, formatAccountOriginLabel } from "./accountOrigin.js";

/**
 * @typedef {object} WealthDailyPoint
 * @property {string} day — yyyy-MM-dd
 * @property {string} label — short label for chart axis
 * @property {number} assets
 * @property {number} liabilities
 */

/**
 * Replay entry create/update events into per-day totals.
 * @param {import('./netWorth/wealthStorage.js').WealthEntry[]} entries
 * @param {string} [profileId]
 */
export function buildWealthDailySeriesFromEntries(entries, profileId = "default") {
  const scoped = filterWealthByProfile(entries, profileId);
  if (!scoped.length) return [];

  /** @type {{ ts: number, id: string, entry: import('./netWorth/wealthStorage.js').WealthEntry }[]} */
  const events = [];
  for (const e of scoped) {
    events.push({ ts: e.createdAt, id: e.id, entry: e });
    if ((e.updatedAt || 0) > (e.createdAt || 0) + 500) {
      events.push({ ts: e.updatedAt, id: e.id, entry: e });
    }
  }
  events.sort((a, b) => a.ts - b.ts);

  /** @type {Map<string, import('./netWorth/wealthStorage.js').WealthEntry>} */
  const live = new Map();
  /** @type {Map<string, WealthDailyPoint>} */
  const byDay = new Map();

  for (const ev of events) {
    live.set(ev.id, ev.entry);
    const day = format(new Date(ev.ts), "yyyy-MM-dd");
    const core = computeNetWorthCore([...live.values()]);
    byDay.set(day, {
      day,
      label: format(new Date(ev.ts), "d MMM"),
      assets: Math.round(core.totalAssets),
      liabilities: Math.round(core.totalLiabilities),
    });
  }

  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * @param {import('./netWorth/wealthStorage.js').WealthSnapshot[]} dailySnapshots
 * @param {import('./netWorth/wealthStorage.js').WealthEntry[]} entries
 * @param {string} profileId
 * @param {number} totalAssets
 * @param {number} totalLiabilities
 * @param {number} [accountCreatedAt] ms epoch
 * @returns {WealthDailyPoint[]}
 */
export function buildWealthDailySeries(
  dailySnapshots,
  entries,
  profileId,
  totalAssets,
  totalLiabilities,
  accountCreatedAt = 0,
) {
  const fromStored = (dailySnapshots || [])
    .map((s) => ({
      day: String(s.month || s.day || ""),
      label: s.label || formatDayLabel(s.month || s.day || ""),
      assets: Math.round(Number(s.totalAssets) || 0),
      liabilities: Math.round(Number(s.totalLiabilities) || 0),
      recordedAt: Number(s.recordedAt) || 0,
    }))
    .filter((p) => p.day)
    .sort((a, b) => a.day.localeCompare(b.day));

  let points =
    fromStored.length > 0
      ? fromStored.map(({ day, label, assets, liabilities }) => ({ day, label, assets, liabilities }))
      : buildWealthDailySeriesFromEntries(entries, profileId);

  const today = format(new Date(), "yyyy-MM-dd");
  const assetsNow = Math.round(totalAssets);
  const liabNow = Math.round(totalLiabilities);
  const last = points[points.length - 1];
  if (!last || last.assets !== assetsNow || last.liabilities !== liabNow || last.day !== today) {
    if (last?.day === today) {
      points = [...points.slice(0, -1), { day: today, label: formatDayLabel(today), assets: assetsNow, liabilities: liabNow }];
    } else {
      points = [...points, { day: today, label: formatDayLabel(today), assets: assetsNow, liabilities: liabNow }];
    }
  }

  if (!points.length && (assetsNow > 0 || liabNow > 0)) {
    points = [{ day: today, label: formatDayLabel(today), assets: assetsNow, liabilities: liabNow }];
  }

  const originDay =
    accountCreatedAt > 0 ? accountOriginDayKey(accountCreatedAt) : points[0]?.day || today;
  const originLabel =
    accountCreatedAt > 0
      ? formatAccountOriginLabel(accountCreatedAt)
      : formatDayLabel(originDay);

  const origin = { day: originDay, label: originLabel, assets: 0, liabilities: 0 };
  const afterOrigin = points.filter((p) => !originDay || p.day >= originDay);

  return [origin, ...afterOrigin];
}

function formatDayLabel(dayKey) {
  if (!dayKey || dayKey === "origin") return "";
  try {
    return format(new Date(`${dayKey}T12:00:00`), "d MMM");
  } catch {
    return dayKey;
  }
}
