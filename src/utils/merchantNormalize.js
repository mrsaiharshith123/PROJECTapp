import { lifeCategoryForBillCategory, getTransactionLifeCategoryMeta } from "../constants/transactionCategories.js";

const KNOWN_MERCHANTS = [
  // ── Food delivery (unit tests rely on Swiggy/Zomato ids) ─────────────────
  { pattern: /swiggy/i, profile: { id: "swiggy", label: "Swiggy", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /zomato/i, profile: { id: "zomato", label: "Zomato", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /uber\s*eats/i, profile: { id: "food_delivery_uber_eats", label: "Uber Eats", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /ola\s*foods?/i, profile: { id: "food_delivery_ola_foods", label: "Ola Foods", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /dominos?/i, profile: { id: "food_delivery_dominos", label: "Domino's", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /pizza\s*hut/i, profile: { id: "food_delivery_pizza_hut", label: "Pizza Hut", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /burger\s*king/i, profile: { id: "food_delivery_burger_king", label: "Burger King", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /mc\s*donald'?s|mcdonald/i, profile: { id: "food_delivery_mcdonalds", label: "McDonald's", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /kfc/i, profile: { id: "food_delivery_kfc", label: "KFC", lifeCategory: "lifestyle", spendType: "food_delivery" } },
  { pattern: /swiggy\s*instamart|instamart/i, profile: { id: "food_delivery_instamart", label: "Instamart", lifeCategory: "survival", spendType: "groceries" } },

  // ── Grocery delivery & supermarkets ──────────────────────────────────
  { pattern: /bigbasket/i, profile: { id: "bigbasket", label: "BigBasket", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /blinkit/i, profile: { id: "blinkit", label: "Blinkit", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /zepto/i, profile: { id: "zepto", label: "Zepto", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /grofers?/i, profile: { id: "grofers", label: "Grofers", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /dmart/i, profile: { id: "dmart", label: "DMart", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /more\s*supermarket/i, profile: { id: "more", label: "More Supermarket", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /reliance\s*fresh/i, profile: { id: "reliance_fresh", label: "Reliance Fresh", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /spencer'?s/i, profile: { id: "spencers", label: "Spencer's", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /shop\s*at\s*spencers/i, profile: { id: "spencers", label: "Spencer's", lifeCategory: "survival", spendType: "groceries" } },
  { pattern: /freshpik|fresh\s*to\s*home|freshto/i, profile: { id: "fresh_delivery", label: "Fresh delivery", lifeCategory: "survival", spendType: "groceries" } },

  // ── Online shopping & marketplaces ───────────────────────────────────
  { pattern: /amazon(\.in)?/i, profile: { id: "amazon", label: "Amazon", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /flipkart/i, profile: { id: "flipkart", label: "Flipkart", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /myntra/i, profile: { id: "myntra", label: "Myntra", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /ajio/i, profile: { id: "ajio", label: "AJIO", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /tata\s*cliq|tatacliq/i, profile: { id: "tatacliq", label: "Tata Cliq", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /meesho/i, profile: { id: "meesho", label: "Meesho", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /shopclues/i, profile: { id: "shopclues", label: "ShopClues", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /nykaa/i, profile: { id: "nykaa", label: "Nykaa", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /lenskart/i, profile: { id: "lenskart", label: "Lenskart", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /western\s*wear|zovi/i, profile: { id: "ecommerce_other", label: "Online shopping", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /bigrock/i, profile: { id: "bigrock", label: "BigRock", lifeCategory: "lifestyle", spendType: "software" } },
  { pattern: /udemy/i, profile: { id: "udemy", label: "Udemy", lifeCategory: "growth", spendType: "education" } },

  // ── Subscription media & entertainment ───────────────────────────────
  { pattern: /netflix/i, profile: { id: "netflix", label: "Netflix", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /spotify/i, profile: { id: "spotify", label: "Spotify", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /prime\s*video|primevideo|amazon\s*prime/i, profile: { id: "prime_video", label: "Prime Video", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /hotstar|hotstar\s*|disney\+|disney\s*plus|jio\s*cinema/i, profile: { id: "hotstar_streaming", label: "Streaming", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /youtube\s*premium|yt\s*premium/i, profile: { id: "youtube_premium", label: "YouTube Premium", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /jio\s*music|saavn|gaana/i, profile: { id: "music_subscription", label: "Music subscription", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /zee5/i, profile: { id: "zee5", label: "ZEE5", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /aha\s*|aha!/i, profile: { id: "aha", label: "aha", lifeCategory: "lifestyle", spendType: "subscription" } },

  // ── Medical / healthcare ─────────────────────────────────────────────
  { pattern: /apollo/i, profile: { id: "medical_apollo", label: "Apollo", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /fortis/i, profile: { id: "medical_fortis", label: "Fortis", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /max\s*healthcare|max healthcare/i, profile: { id: "medical_max", label: "Max Healthcare", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /medanta/i, profile: { id: "medical_medanta", label: "Medanta", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /manipal/i, profile: { id: "medical_manipal", label: "Manipal", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /practo/i, profile: { id: "medical_practo", label: "Practo", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /1mg|one\s*mg/i, profile: { id: "medical_1mg", label: "1mg", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /pharmEasy|pharmeasy/i, profile: { id: "medical_pharmeasy", label: "PharmEasy", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /netmeds/i, profile: { id: "medical_netmeds", label: "Netmeds", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /metropolis\s*labs|metropolis/i, profile: { id: "medical_metropolis", label: "Metropolis Labs", lifeCategory: "survival", spendType: "medical" } },
  { pattern: /pathlab|diagnostic/i, profile: { id: "medical_diagnostics", label: "Diagnostics", lifeCategory: "survival", spendType: "medical" } },

  // ── Ride / transport ─────────────────────────────────────────────────
  { pattern: /uber/i, profile: { id: "ride_uber", label: "Uber", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /ola\s*cabs?|\bola\b/i, profile: { id: "ride_ola", label: "Ola", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /rapido/i, profile: { id: "ride_rapido", label: "Rapido", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /indrive|in\s*drive/i, profile: { id: "ride_indrive", label: "inDrive", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /redbus/i, profile: { id: "transport_redbus", label: "RedBus", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /irctc/i, profile: { id: "transport_irctc", label: "IRCTC", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /yatra/i, profile: { id: "transport_yatra", label: "Yatra", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /make\s*my\s*trip|mmt/i, profile: { id: "transport_mmt", label: "MakeMyTrip", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /goibibo/i, profile: { id: "transport_goibibo", label: "Goibibo", lifeCategory: "lifestyle", spendType: "transport" } },
  { pattern: /ola\s*electric/i, profile: { id: "transport_ola_electric", label: "Ola Electric", lifeCategory: "lifestyle", spendType: "transport" } },

  // ── Telecom / internet ────────────────────────────────────────────────
  { pattern: /airtel/i, profile: { id: "telecom_airtel", label: "Airtel", lifeCategory: "pressure", spendType: "telecom" } },
  { pattern: /jio/i, profile: { id: "telecom_jio", label: "Jio", lifeCategory: "pressure", spendType: "telecom" } },
  { pattern: /vi\s*|vodafone\s*idea|vodafone/i, profile: { id: "telecom_vi", label: "Vodafone Idea", lifeCategory: "pressure", spendType: "telecom" } },
  { pattern: /tata\s*play/i, profile: { id: "telecom_tataplay", label: "Tata Play", lifeCategory: "pressure", spendType: "subscription" } },
  { pattern: /dth|dishtv|dish\s*tv/i, profile: { id: "telecom_dth", label: "DTH", lifeCategory: "pressure", spendType: "subscription" } },
  { pattern: /hathway|tatasky|d2h/i, profile: { id: "telecom_tv_other", label: "TV subscription", lifeCategory: "pressure", spendType: "subscription" } },

  // ── Education / learning ─────────────────────────────────────────────
  { pattern: /byju'?s/i, profile: { id: "education_byjus", label: "Byju's", lifeCategory: "growth", spendType: "education" } },
  { pattern: /unacademy/i, profile: { id: "education_unacademy", label: "Unacademy", lifeCategory: "growth", spendType: "education" } },
  { pattern: /vedantu/i, profile: { id: "education_vedantu", label: "Vedantu", lifeCategory: "growth", spendType: "education" } },
  { pattern: /coursera/i, profile: { id: "education_coursera", label: "Coursera", lifeCategory: "growth", spendType: "education" } },
  { pattern: /udemy/i, profile: { id: "education_udemy", label: "Udemy", lifeCategory: "growth", spendType: "education" } },

  // ── Utilities / household essentials ─────────────────────────────────
  { pattern: /electricity|bescom|tneb|msedcl|mseb|best\b/i, profile: { id: "utility_electricity", label: "Electricity", lifeCategory: "survival", spendType: "utilities" } },
  { pattern: /water|jal|water\s*bill/i, profile: { id: "utility_water", label: "Water", lifeCategory: "survival", spendType: "utilities" } },
  { pattern: /gas\s*booking|indane|lpg|hp\s*gas|bharat\s*gas/i, profile: { id: "utility_lpg", label: "LPG / Gas", lifeCategory: "survival", spendType: "utilities" } },
  { pattern: /indian\s*oil|indianoil/i, profile: { id: "utility_fuel_indian_oil", label: "Indian Oil", lifeCategory: "survival", spendType: "fuel" } },
  { pattern: /bharat\s*petroleum|bpcl/i, profile: { id: "utility_fuel_bpcl", label: "BPCL", lifeCategory: "survival", spendType: "fuel" } },
  { pattern: /hpcl/i, profile: { id: "utility_fuel_hpcl", label: "HPCL", lifeCategory: "survival", spendType: "fuel" } },
  { pattern: /ibp/i, profile: { id: "utility_fuel_ibp", label: "IBP", lifeCategory: "survival", spendType: "fuel" } },

  // ── Financial / insurance / rent / fees ───────────────────────────────
  { pattern: /hdfc\s*life|icici\s*lombard|bajaj\s*allianz|max\s*life|lic\b/i, profile: { id: "insurance", label: "Insurance", lifeCategory: "pressure", spendType: "insurance" } },
  { pattern: /lic/i, profile: { id: "insurance_lic", label: "LIC", lifeCategory: "pressure", spendType: "insurance" } },
  { pattern: /rent/i, profile: { id: "rent", label: "Rent", lifeCategory: "pressure", spendType: "rent" } },
  { pattern: /croma|reliance\s*digital|chrom/i, profile: { id: "electronics", label: "Electronics", lifeCategory: "lifestyle", spendType: "shopping" } },
  { pattern: /chromecart|laptops|mobile|iphone|samsung/i, profile: { id: "electronics_other", label: "Electronics", lifeCategory: "lifestyle", spendType: "shopping" } },

  // ── Misc subscriptions / events / entertainment ──────────────────────
  { pattern: /bookmyshow/i, profile: { id: "events_bookmyshow", label: "BookMyShow", lifeCategory: "lifestyle", spendType: "entertainment" } },
  { pattern: /paytm|google\s*pay|gpay|phonepe|payu|amazon\s*pay/i, profile: { id: "fintech_payments", label: "Digital payments", lifeCategory: "lifestyle", spendType: "other" } },
  { pattern: /zomato\s*gold|swiggy\s*one/i, profile: { id: "subscription_delivery", label: "Delivery subscription", lifeCategory: "lifestyle", spendType: "subscription" } },
  { pattern: /netflix\s*gift|spotify\s*family/i, profile: { id: "subscription_misc", label: "Streaming subscription", lifeCategory: "lifestyle", spendType: "subscription" } },

  // ── Fallback kept small; more merchants can be added gradually ─────────
  // Note: classifyMerchant ultimately falls back to life-category derived from billCategory.
];

export function normalizeMerchantKey(raw) {
  return String(raw || "").trim().toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s&.-]/g, "") || "unknown";
}

export function classifyMerchant(name, billCategory) {
  const key = normalizeMerchantKey(name);
  for (const { pattern, profile } of KNOWN_MERCHANTS) {
    if (pattern.test(key) || pattern.test(String(name || ""))) return { ...profile, key };
  }
  const lifeCategory = lifeCategoryForBillCategory(billCategory);
  return {
    id: key.slice(0, 48) || "unknown",
    label: String(name || "Unknown").trim() || "Unknown",
    lifeCategory,
    lifeCategoryLabel: getTransactionLifeCategoryMeta(lifeCategory).label,
    spendType: "other",
    key,
  };
}

export function groupCommitmentsByMerchant(commitments) {
  const map = new Map();
  for (const c of commitments || []) {
    const profile = classifyMerchant(c.name, c.category);
    const bucket = map.get(profile.key) || { profile, commitments: [], monthly: 0 };
    bucket.commitments.push(c);
    bucket.monthly += Math.max(0, Number(c.amount) || 0);
    map.set(profile.key, bucket);
  }
  return [...map.values()].sort((a, b) => b.monthly - a.monthly);
}
