import { format, parseISO, subDays } from "date-fns";
import { sumDailySpendsInRange } from "../utils/dailySpends.js";
import {
  getCityDailyAvg,
  getCityLabel,
  NATIONAL_DAILY_AVG_INR,
  normalizeCityId,
} from "../constants/cityLivingCosts.js";

/**
 * Days with at least one logged spend in range.
 * @param {object[]} spends
 * @param {string} startYmd
 * @param {string} endYmd
 */
function countActiveSpendDays(spends, startYmd, endYmd) {
  const days = new Set();
  for (const s of spends || []) {
    if (!s.date || s.date < startYmd || s.date > endYmd) continue;
    days.add(s.date);
  }
  return days.size;
}

/**
 * Daily living cost for survival runway — prefers logged spends, else city benchmark.
 * @param {{ settings?: object, dailySpends?: object[], todayStr?: string, lookbackDays?: number }} params
 */
export function resolveDailyLivingCost({
  settings = {},
  dailySpends = [],
  todayStr = "",
  lookbackDays = 30,
}) {
  const end = todayStr || format(new Date(), "yyyy-MM-dd");
  let start;
  try {
    start = format(subDays(parseISO(`${end}T12:00:00`), lookbackDays), "yyyy-MM-dd");
  } catch {
    start = end;
  }

  const total = sumDailySpendsInRange(dailySpends, start, end);
  const activeDays = countActiveSpendDays(dailySpends, start, end);

  if (activeDays >= 5 && total > 0) {
    return {
      dailyInr: Math.round(total / lookbackDays),
      monthlyInr: Math.round((total / lookbackDays) * 30),
      source: "logged",
      activeDays,
      lookbackDays,
      cityId: null,
      cityLabel: null,
    };
  }

  const cityId = normalizeCityId(settings.userCity);
  const dailyInr = cityId
    ? getCityDailyAvg(cityId, settings.householdScope)
    : settings.householdScope === "family"
      ? Math.round(NATIONAL_DAILY_AVG_INR * 1.55)
      : NATIONAL_DAILY_AVG_INR;
  return {
    dailyInr,
    monthlyInr: dailyInr * 30,
    source: cityId ? "city" : "national",
    activeDays: 0,
    lookbackDays,
    cityId: cityId || null,
    cityLabel: cityId ? getCityLabel(cityId) : "India average",
  };
}
