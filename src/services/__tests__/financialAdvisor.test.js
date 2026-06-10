import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildContextData,
  buildSystemPrompt,
  buildLocalAnswer,
  askFinancialAdvisor,
} from "../financialAdvisor.js";
import { getSupabaseClient } from "../supabase/auth.js";

vi.mock("../supabase/auth.js", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("buildContextData", () => {
  it("maps hook intel and stability shapes", () => {
    const ctx = buildContextData({
      commitments: [],
      settings: {},
      income: 100_000,
      intel: {
        stability: { monthlyBurden: 40_000, freeMoney: 60_000, score: 55 },
      },
      stable: {
        overdueCount: 2,
        survival: { survivalMonths: 8 },
        stress: { top: [{ name: "Home EMI", weight: 18_500 }] },
      },
    });
    expect(ctx.income).toBe(100_000);
    expect(ctx.monthlyBurden).toBe(40_000);
    expect(ctx.committedPct).toBe(40);
    expect(ctx.freeCash).toBe(60_000);
    expect(ctx.pressureScore).toBe(55);
    expect(ctx.survivalMonths).toBe(8);
    expect(ctx.overdueCount).toBe(2);
    expect(ctx.topStressor).toBe("Home EMI");
    expect(ctx.topStressorAmount).toBe(18_500);
  });
});

describe("buildSystemPrompt", () => {
  it("includes user numbers and stressor line", () => {
    const prompt = buildSystemPrompt({
      income: 80_000,
      monthlyBurden: 30_000,
      committedPct: 38,
      freeCash: 50_000,
      pressureScore: 62,
      pressureLabel: "Moderate",
      survivalMonths: 6,
      overdueCount: 1,
      topStressor: "Rent",
      topStressorAmount: 15_000,
    });
    expect(prompt).toContain("₹80000");
    expect(prompt).toContain("Top stressor: Rent");
    expect(prompt).toContain("Educational only");
  });
});

describe("buildLocalAnswer", () => {
  const base = {
    freeCash: 20_000,
    pressureScore: 70,
    pressureLabel: "Constrained",
    survivalMonths: 4,
    topStressor: "Car EMI",
  };

  it("handles affordability questions", () => {
    const { answer, source } = buildLocalAnswer("Can I afford ₹10,000 EMI?", base);
    expect(source).toBe("local");
    expect(answer).toContain("10,000");
    expect(answer).toContain("Educational only");
  });

  it("handles pressure questions", () => {
    const { answer } = buildLocalAnswer("Why is my pressure score high?", base);
    expect(answer).toContain("70/100");
    expect(answer).toContain("Car EMI");
  });

  it("handles survival questions", () => {
    const { answer } = buildLocalAnswer("How long can I survive without income?", base);
    expect(answer).toContain("4 months");
  });
});

describe("askFinancialAdvisor", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseClient).mockReset();
  });

  it("falls back locally when edge function is unavailable", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue(null);
    const result = await askFinancialAdvisor({
      question: "What is my pressure score?",
      contextData: buildContextData({
        commitments: [],
        settings: {},
        income: 50_000,
        intel: { stability: { score: 50, monthlyBurden: 10_000, freeMoney: 40_000 } },
        stable: {},
      }),
    });
    expect(result.source).toBe("local");
    expect(result.answer).toMatch(/pressure score/i);
  });

  it("uses edge function answer when available", async () => {
    vi.mocked(getSupabaseClient).mockReturnValue({
      functions: {
        invoke: vi.fn().mockResolvedValue({
          data: { answer: "Your free cash looks healthy. Educational only." },
          error: null,
        }),
      },
    });
    const result = await askFinancialAdvisor({
      question: "How am I doing?",
      contextData: buildContextData({
        commitments: [],
        settings: {},
        income: 50_000,
        intel: {},
        stable: {},
      }),
    });
    expect(result.source).toBe("ai");
    expect(result.answer).toContain("free cash");
  });
});
