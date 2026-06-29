import { INDIAN_CITIES, DEFAULT_CITY_ID, normalizeCityId } from "./cityLivingCosts.js";

/** Approximate map centers for picker defaults (not survey-grade). */
const CITY_COORDS = {
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  delhi: { lat: 28.6139, lng: 77.209 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  noida: { lat: 28.5355, lng: 77.391 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mangalore: { lat: 12.9141, lng: 74.856 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  siliguri: { lat: 26.7271, lng: 88.3953 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  jodhpur: { lat: 26.2389, lng: 73.0243 },
  udaipur: { lat: 24.5854, lng: 73.7125 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  varanasi: { lat: 25.3176, lng: 82.9739 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  ludhiana: { lat: 30.901, lng: 75.8573 },
  amritsar: { lat: 31.634, lng: 74.8723 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  raipur: { lat: 21.2514, lng: 81.6296 },
  patna: { lat: 25.5941, lng: 85.1376 },
  ranchi: { lat: 23.3441, lng: 85.3096 },
  bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  dehradun: { lat: 30.3165, lng: 78.0322 },
  shimla: { lat: 31.1048, lng: 77.1734 },
  srinagar: { lat: 34.0837, lng: 74.7973 },
  panaji: { lat: 15.4909, lng: 73.8278 },
  other: { lat: 20.5937, lng: 78.9629 },
};

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

/** @param {string} [cityId] */
export function getCityMapCenter(cityId) {
  const id = normalizeCityId(cityId) || DEFAULT_CITY_ID;
  return CITY_COORDS[id] || INDIA_CENTER;
}

/** Seed coords for cities missing explicit entry — keeps picker useful everywhere. */
for (const city of INDIAN_CITIES) {
  if (!CITY_COORDS[city.id]) CITY_COORDS[city.id] = INDIA_CENTER;
}
