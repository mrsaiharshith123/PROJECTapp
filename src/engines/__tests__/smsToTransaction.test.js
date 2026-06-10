import { describe, expect, it } from "vitest";
import { smsTextToDailySpendDraft } from "../smsToTransaction.js";

describe("smsTextToDailySpendDraft", () => {
  it("parses UPI debit SMS into spend draft", () => {
    const r = smsTextToDailySpendDraft(
      "Rs.450.00 debited from A/c **1234 on 05-06-26 to SWIGGY UPI Ref 123",
    );
    expect(r?.amount).toBeGreaterThan(0);
  });
});
