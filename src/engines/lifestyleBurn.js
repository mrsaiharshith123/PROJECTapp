import { format, parseISO, subDays } from "date-fns";
import {
  getCityDailyAvg,
  getCityLabel,
  NATIONAL_DAILY_AVG_INR,
  normalizeCityId,
} from "../constants/cityLivingCosts.js";

/**
 * Daily living cost for survival runway — city benchmark or national average.
 * @param {{ settings?: object, todayStr?: string, lookbackDays?: number }} params
 */
export function resolveDailyLivingCost({ settings = {}, todayStr = "", lookbackDays = 30 }) {
  const end = todayStr || format(new Date(), "yyyy-MM-dd");
  try {
    format(subDays(parseISO(`${end}T12:00:00`), lookbackDays), "yyyy-MM-dd");
  } catch {
    /* ignore */
  }

  const cityId = normalizeCityId(settings.userCity);
  const dailyInr = cityId ? getCityDailyAvg(cityId) : NATIONAL_DAILY_AVG_INR;
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
