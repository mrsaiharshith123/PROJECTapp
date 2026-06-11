import { describe, expect, it } from "vitest";
import {
  smsTextToDailySpendDraft,
  isDebitSms,
  batchSmsToDailySpendDrafts,
} from "../smsToTransaction.js";

const DEBIT_SMS =
  "Rs.450.00 debited from A/c **1234 on 05-06-26 to SWIGGY UPI Ref ABC123456";

describe("smsToTransaction", () => {
  it("parses UPI debit SMS into spend draft with merchant", () => {
    const r = smsTextToDailySpendDraft(DEBIT_SMS);
    expect(r?.amount).toBe(450);
    expect(r?.lifeCategory).toBeTruthy();
    expect(r?.confidence).toBeGreaterThan(0.7);
    expect(r?.reference).toBe("ABC123456");
  });

  it("rejects credit SMS", () => {
    expect(isDebitSms("Rs.500 credited to A/c **1234")).toBe(false);
    expect(isDebitSms(DEBIT_SMS)).toBe(true);
  });

  it("batch parses multiple lines", () => {
    const rows = batchSmsToDailySpendDrafts(`${DEBIT_SMS}\nRs.200 debited to ZOMATO on 06-06-26`);
    expect(rows.length).toBe(2);
  });
});
