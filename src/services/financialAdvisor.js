import { pressureScoreLabel } from "../engines/pressureScore.js";
import { getSupabaseClient } from "./supabase/auth.js";

const ADVISOR_FUNCTION = "financial-advisor";

/**
 * @param {{ commitments?: object[], settings?: object, intel?: object, stable?: object, income?: number }} params
 */
export function buildContextData({ commitments, settings, intel, stable, income }) {
  void settings;
  const monthlyBurden =
    intel?.totalBurden ?? intel?.stability?.monthlyBurden ?? 0;
  const freeCash =
    intel?.freeCash ?? intel?.freeMoneyAfterBurden ?? intel?.stability?.freeMoney ?? 0;
  const pressureScore = intel?.pressureScore ?? intel?.stability?.score ?? null;
  const survival = stable?.survival;
  const survivalMonths = stable?.survivalMonths ?? survival?.survivalMonths ?? null;
  const lifestyle = survival?.lifestyle;
  const overdueCount =
    stable?.overdueCount ??
    (commitments || []).filter((c) => c._computedStatus === "overdue").length;
  const top = stable?.stress?.top?.[0];

  return {
    income: Math.round(income || 0),
    monthlyBurden: Math.round(monthlyBurden),
    committedPct:
      income > 0 ? Math.round((monthlyBurden / income) * 100) : 0,
    freeCash: Math.round(freeCash),
    pressureScore,
    pressureLabel:
      typeof pressureScoreLabel === "function" && pressureScore != null
        ? pressureScoreLabel(pressureScore).label
        : "Unknown",
    survivalMonths,
    overdueCount,
    topStressor: top?.name ?? null,
    topStressorAmount: top ? Math.round(top.weight) : 0,
    dailyLivingCost: lifestyle?.dailyInr ?? null,
    livingCostSource: lifestyle?.source ?? null,
    cityLabel: lifestyle?.cityLabel ?? null,
  };
}

/**
 * @param {ReturnType<typeof buildContextData>} ctx
 */
export function buildSystemPrompt(ctx) {
  const stressLine = ctx.topStressor
    ? `- Top stressor: ${ctx.topStressor} (₹${ctx.topStressorAmount}/month)`
    : "";

  return `You are a calm, practical personal financial advisor for a salaried Indian user.
Their live financial data:
- Monthly income: ₹${ctx.income}
- Monthly obligations: ₹${ctx.monthlyBurden} (${ctx.committedPct}% of income)
- Free cash after obligations: ₹${ctx.freeCash}
- Pressure score: ${ctx.pressureScore ?? "not calculated"}/100 (${ctx.pressureLabel})
- Survival runway: ${ctx.survivalMonths != null ? `${ctx.survivalMonths} months` : "not calculated"}
- Overdue commitments: ${ctx.overdueCount}
${stressLine}

Rules:
- Answer only about this user's specific situation using their numbers.
- Be concise: 2–3 sentences maximum.
- End with one practical recommendation.
- Always add: 'Educational only — not financial advice.'
- Never recommend specific financial products, insurance providers, or broker names.`;
}

/**
 * @param {{ question: string, contextData: ReturnType<typeof buildContextData> }} params
 * @returns {Promise<{ answer: string, source: "ai" | "local" }>}
 */
export async function askFinancialAdvisor({ question, contextData }) {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke(ADVISOR_FUNCTION, {
        body: { question, contextData },
      });
      if (!error && data?.answer) {
        return { answer: String(data.answer), source: "ai" };
      }
    } catch {
      // fall through to local answer
    }
  }
  return buildLocalAnswer(question, contextData);
}

/**
 * @param {string} question
 * @param {ReturnType<typeof buildContextData>} ctx
 * @returns {{ answer: string, source: "local" }}
 */
export function buildLocalAnswer(question, ctx) {
  const q = question.toLowerCase();
  if (/afford|emi|loan|₹|rupee/i.test(q)) {
    const match = question.match(/₹?\s*([\d,]+)/);
    const amt = match ? Number(match[1].replace(/,/g, "")) : null;
    if (amt && ctx.freeCash > 0) {
      const feasible = amt < ctx.freeCash * 0.5;
      return {
        answer: `Adding ₹${amt.toLocaleString("en-IN")}/month ${feasible ? "is manageable" : "would be a stretch"} given your ₹${ctx.freeCash.toLocaleString("en-IN")} free cash. Your pressure score would rise. Educational only.`,
        source: "local",
      };
    }
  }
  if (/pressure|score|stressed/i.test(q)) {
    return {
      answer: `Your pressure score is ${ctx.pressureScore ?? "not calculated"}/100 (${ctx.pressureLabel}). ${ctx.topStressor ? `Top contributor: ${ctx.topStressor}.` : ""} Educational only.`,
      source: "local",
    };
  }
  if (/survive|emergency|job|income/i.test(q)) {
    const costHint =
      ctx.dailyLivingCost != null
        ? ctx.livingCostSource === "logged"
          ? ` Based on your logged spends (~₹${ctx.dailyLivingCost.toLocaleString("en-IN")}/day).`
          : ctx.cityLabel
            ? ` Uses ~₹${ctx.dailyLivingCost.toLocaleString("en-IN")}/day for ${ctx.cityLabel}.`
            : ""
        : "";
    return {
      answer: `At current obligations, you have ${ctx.survivalMonths ?? "unknown"} months of survival runway.${costHint} Educational only.`,
      source: "local",
    };
  }
  return {
    answer:
      "Ask me about affordability, pressure score, or survival runway. Educational only.",
    source: "local",
  };
}
