const GOLD_API = "https://www.goldapi.io/api/XAU/INR";
const GOLD_KEY = import.meta.env.VITE_GOLD_API_KEY || "";

export function isGoldApiConfigured() {
  return Boolean(GOLD_KEY);
}

export async function fetchGoldPricePerGram() {
  if (!GOLD_KEY) return null;
  try {
    const res = await fetch(GOLD_API, {
      headers: { "x-access-token": GOLD_KEY, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const perGram = data.price / 31.1035;
    return {
      perGram: Math.round(perGram),
      per10g: Math.round(perGram * 10),
      date: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
