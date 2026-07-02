/**
 * Approximate daily living spend (food, commute, misc) for a salaried adult.
 * Indicative benchmarks — not survey data. Used when spend logs are sparse.
 * @typedef {{ id: string, label: string, state: string, dailyAvgInr: number, tier: string }} CityRow
 */

/** @type {CityRow[]} */
export const INDIAN_CITIES = [
  { id: "mumbai", label: "Mumbai", state: "Maharashtra", dailyAvgInr: 1850, tier: "metro" },
  { id: "pune", label: "Pune", state: "Maharashtra", dailyAvgInr: 1250, tier: "tier1" },
  { id: "nagpur", label: "Nagpur", state: "Maharashtra", dailyAvgInr: 800, tier: "tier2" },
  { id: "nashik", label: "Nashik", state: "Maharashtra", dailyAvgInr: 850, tier: "tier2" },
  { id: "delhi", label: "Delhi NCR", state: "Delhi", dailyAvgInr: 1650, tier: "metro" },
  { id: "gurugram", label: "Gurugram", state: "Haryana", dailyAvgInr: 1500, tier: "metro" },
  { id: "noida", label: "Noida", state: "Uttar Pradesh", dailyAvgInr: 1400, tier: "tier1" },
  { id: "bangalore", label: "Bengaluru", state: "Karnataka", dailyAvgInr: 1600, tier: "metro" },
  { id: "mysuru", label: "Mysuru", state: "Karnataka", dailyAvgInr: 900, tier: "tier2" },
  { id: "mangalore", label: "Mangaluru", state: "Karnataka", dailyAvgInr: 950, tier: "tier2" },
  { id: "hyderabad", label: "Hyderabad", state: "Telangana", dailyAvgInr: 1350, tier: "metro" },
  { id: "warangal", label: "Warangal", state: "Telangana", dailyAvgInr: 750, tier: "tier2" },
  { id: "chennai", label: "Chennai", state: "Tamil Nadu", dailyAvgInr: 1300, tier: "metro" },
  { id: "coimbatore", label: "Coimbatore", state: "Tamil Nadu", dailyAvgInr: 900, tier: "tier2" },
  { id: "madurai", label: "Madurai", state: "Tamil Nadu", dailyAvgInr: 800, tier: "tier2" },
  { id: "kolkata", label: "Kolkata", state: "West Bengal", dailyAvgInr: 1200, tier: "metro" },
  { id: "siliguri", label: "Siliguri", state: "West Bengal", dailyAvgInr: 750, tier: "tier2" },
  { id: "ahmedabad", label: "Ahmedabad", state: "Gujarat", dailyAvgInr: 1150, tier: "tier1" },
  { id: "surat", label: "Surat", state: "Gujarat", dailyAvgInr: 950, tier: "tier1" },
  { id: "vadodara", label: "Vadodara", state: "Gujarat", dailyAvgInr: 850, tier: "tier2" },
  { id: "jaipur", label: "Jaipur", state: "Rajasthan", dailyAvgInr: 950, tier: "tier2" },
  { id: "jodhpur", label: "Jodhpur", state: "Rajasthan", dailyAvgInr: 800, tier: "tier2" },
  { id: "udaipur", label: "Udaipur", state: "Rajasthan", dailyAvgInr: 820, tier: "tier2" },
  { id: "lucknow", label: "Lucknow", state: "Uttar Pradesh", dailyAvgInr: 900, tier: "tier2" },
  { id: "kanpur", label: "Kanpur", state: "Uttar Pradesh", dailyAvgInr: 820, tier: "tier2" },
  { id: "varanasi", label: "Varanasi", state: "Uttar Pradesh", dailyAvgInr: 780, tier: "tier2" },
  { id: "chandigarh", label: "Chandigarh", state: "Chandigarh", dailyAvgInr: 1150, tier: "tier2" },
  { id: "ludhiana", label: "Ludhiana", state: "Punjab", dailyAvgInr: 900, tier: "tier2" },
  { id: "amritsar", label: "Amritsar", state: "Punjab", dailyAvgInr: 850, tier: "tier2" },
  { id: "kochi", label: "Kochi", state: "Kerala", dailyAvgInr: 1100, tier: "tier2" },
  { id: "thiruvananthapuram", label: "Thiruvananthapuram", state: "Kerala", dailyAvgInr: 1000, tier: "tier2" },
  { id: "kozhikode", label: "Kozhikode", state: "Kerala", dailyAvgInr: 900, tier: "tier2" },
  { id: "bhopal", label: "Bhopal", state: "Madhya Pradesh", dailyAvgInr: 800, tier: "tier2" },
  { id: "indore", label: "Indore", state: "Madhya Pradesh", dailyAvgInr: 850, tier: "tier2" },
  { id: "raipur", label: "Raipur", state: "Chhattisgarh", dailyAvgInr: 780, tier: "tier2" },
  { id: "patna", label: "Patna", state: "Bihar", dailyAvgInr: 800, tier: "tier2" },
  { id: "ranchi", label: "Ranchi", state: "Jharkhand", dailyAvgInr: 780, tier: "tier2" },
  { id: "bhubaneswar", label: "Bhubaneswar", state: "Odisha", dailyAvgInr: 850, tier: "tier2" },
  { id: "visakhapatnam", label: "Visakhapatnam", state: "Andhra Pradesh", dailyAvgInr: 850, tier: "tier2" },
  { id: "vijayawada", label: "Vijayawada", state: "Andhra Pradesh", dailyAvgInr: 820, tier: "tier2" },
  { id: "guwahati", label: "Guwahati", state: "Assam", dailyAvgInr: 850, tier: "tier2" },
  { id: "dehradun", label: "Dehradun", state: "Uttarakhand", dailyAvgInr: 900, tier: "tier2" },
  { id: "shimla", label: "Shimla", state: "Himachal Pradesh", dailyAvgInr: 950, tier: "tier2" },
  { id: "srinagar", label: "Srinagar", state: "Jammu & Kashmir", dailyAvgInr: 900, tier: "tier2" },
  { id: "panaji", label: "Panaji / Goa", state: "Goa", dailyAvgInr: 1200, tier: "tier2" },
  { id: "other", label: "Other / smaller town", state: "Other", dailyAvgInr: 750, tier: "tier3" },
];

export const DEFAULT_CITY_ID = "hyderabad";
export const NATIONAL_DAILY_AVG_INR = 1100;

const CITY_BY_ID = Object.fromEntries(INDIAN_CITIES.map((c) => [c.id, c]));

/** @param {string} [raw] */
export function normalizeCityId(raw) {
  const id = String(raw || "").trim().toLowerCase();
  if (!id) return "";
  if (CITY_BY_ID[id]) return id;
  const byLabel = INDIAN_CITIES.find((c) => c.label.toLowerCase() === id);
  return byLabel?.id || "";
}

/**
 * @param {string} [cityId]
 */
export function getCityDailyAvg(cityId) {
  const normalized = normalizeCityId(cityId) || DEFAULT_CITY_ID;
  const city = CITY_BY_ID[normalized] || { dailyAvgInr: NATIONAL_DAILY_AVG_INR };
  return city.dailyAvgInr;
}

/** @param {string} [cityId] */
export function getCityLabel(cityId) {
  const normalized = normalizeCityId(cityId);
  if (!normalized) return "";
  return CITY_BY_ID[normalized]?.label || "";
}

/** Match user text to a city id (for AI advisor). */
export function matchCityFromText(text) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return "";
  const exact = INDIAN_CITIES.find((c) => c.id === q || c.label.toLowerCase() === q);
  if (exact) return exact.id;
  const partial = INDIAN_CITIES.find(
    (c) => c.label.toLowerCase().includes(q) || q.includes(c.label.toLowerCase()),
  );
  return partial?.id || "";
}
