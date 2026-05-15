import { format } from "date-fns";

/** Local calendar YYYY-MM-DD for today */
export function todayYmd() {
  return format(new Date(), "yyyy-MM-dd");
}

/** Compare two YYYY-MM-DD strings; returns negative if a < b */
export function compareYmd(a, b) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}
