import { describe, it, expect } from "vitest";
import {
  buildTransactionInsights,
  buildTransactionLifeFeed,
  transactionInsightsForMerge,
  validateStatementImportRows,
} from "../../services/transactions/index.js";
import { normalizeDailySpend } from "../../utils/dailySpends.js";
import { classifyMerchant } from "../../utils/merchantNormalize.js";
import { smsTextToDailySpendDraft } from "../../engines/smsToTransaction.js";

const todayStr = "2026-06-04";
const getEffectiveStatus = () => "pending";
const getEffectiveLendingStatus = () => "active";

describe("merchantNormalize", () => {
  it("classifies Swiggy as lifestyle food delivery", () => {
    const m = classifyMerchant("Swiggy order");
    expect(m.id).toBe("swiggy");
    expect(m.lifeCategory).toBe("lifestyle");
    expect(m.spendType).toBe("food_delivery");
  });
});

describe("dailySpends", () => {
  it("normalizes spend rows", () => {
    const s = normalizeDailySpend({ amount: 250, label: "Zomato", date: "2026-06-03" });
    expect(s.amount).toBe(250);
    expect(s.merchantId).toBe("zomato");
    expect(s.lifeCategory).toBe("lifestyle");
  });
});

describe("transactionIntel", () => {
  it("returns behavioral insights not raw ledger lines", () => {
    const spends = [
      normalizeDailySpend({ amount: 400, label: "Swiggy", date: "2026-06-02" }),
      normalizeDailySpend({ amount: 350, label: "Zomato", date: "2026-06-03" }),
      normalizeDailySpend({ amount: 300, label: "Swiggy", date: "2026-06-04" }),
    ];
    const input = {
      commitments: [],
      lendings: [],
      settings: {},
      dailySpends: spends,
      todayStr,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      burdenRatio: 0.5,
    };
    const insights = transactionInsightsForMerge(input);
    expect(insights.every((i) => i.text && !i.text.includes("₹400"))).toBe(true);
    const feed = buildTransactionLifeFeed(input, 3);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed[0].text).toBeTruthy();
  });

  it("surfaces rhythm note for dense due weeks without duplicating overlap insight id", () => {
    const input = {
      commitments: [
        { id: 1, name: "Rent", dueDate: "2026-06-05", amount: 10000, remainingAmount: 10000 },
        { id: 2, name: "EMI", dueDate: "2026-06-06", amount: 5000, remainingAmount: 5000 },
        { id: 3, name: "Card", dueDate: "2026-06-07", amount: 3000, remainingAmount: 3000 },
      ],
      lendings: [],
      settings: {},
      dailySpends: [],
      todayStr,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      burdenRatio: 0.7,
    };
    const { rhythmNote } = buildTransactionInsights(input);
    expect(rhythmNote).toMatch(/overlap|higher-risk/i);
    expect(transactionInsightsForMerge(input).some((i) => i.id === "txn-obligation-overlap")).toBe(false);
  });
});

describe("smsToTransaction", () => {
  it("parses debit SMS to draft", () => {
    const draft = smsTextToDailySpendDraft(
      "Rs.500 debited from HDFC Bank A/C XX1234 on 04-06-26"
    );
    expect(draft?.amount).toBe(500);
    expect(draft?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("statementImportSchema", () => {
  it("validates CSV rows", () => {
    const r = validateStatementImportRows([{ date: "2026-06-05", amount: "100" }]);
    expect(r.valid).toBe(1);
    expect(r.ready).toBe(true);
  });
});
