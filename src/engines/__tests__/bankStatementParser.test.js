import { describe, it, expect } from "vitest";
import {
  parseBankStatementText,
  parseBankStatementCsv,
  detectBankFormat,
  computeParseConfidence,
  BANK_FORMATS,
  detectRecurringFromStatement,
  recurringToCommitmentDrafts,
} from "../bankStatementParser.js";

describe("bankStatementParser", () => {
  it("detectBankFormat identifies major Indian banks", () => {
    expect(detectBankFormat("HDFC Bank Ltd Statement")).toBe("hdfc");
    expect(detectBankFormat("State Bank of India")).toBe("sbi");
    expect(detectBankFormat("ICICI Bank Account")).toBe("icici");
    expect(detectBankFormat("Axis Bank Passbook")).toBe("axis");
    expect(detectBankFormat("Kotak Mahindra")).toBe("kotak");
    expect(detectBankFormat("Punjab National Bank")).toBe("pnb");
    expect(detectBankFormat("Bank of Baroda")).toBe("bob");
    expect(detectBankFormat("Random Credit Union")).toBe("generic");
  });

  it("computeParseConfidence scores by bank and row count", () => {
    expect(computeParseConfidence(6, "hdfc")).toBe("high");
    expect(computeParseConfidence(3, "generic")).toBe("medium");
    expect(computeParseConfidence(1, "hdfc")).toBe("low");
  });

  it("exports per-bank column configs", () => {
    expect(BANK_FORMATS.hdfc.debitCol).toBe(3);
    expect(BANK_FORMATS.icici.withdrawalCol).toBe(3);
  });

  it("detects HDFC bank and parses debit rows with confidence", () => {
    const text = `HDFC Bank Statement
01/06/2026 NETFLIX SUBSCRIPTION 499.00
15/06/2026 SALARY CREDIT 85000.00
02/07/2026 NETFLIX SUBSCRIPTION 499.00
03/08/2026 NETFLIX SUBSCRIPTION 499.00
04/09/2026 NETFLIX SUBSCRIPTION 499.00
05/10/2026 NETFLIX SUBSCRIPTION 499.00`;
    const parsed = parseBankStatementText(text);
    expect(parsed.bankDetected).toBe("hdfc");
    expect(parsed.bank).toBe("hdfc");
    expect(parsed.rows.length).toBeGreaterThanOrEqual(2);
    expect(parsed.rows.some((r) => r.type === "debit")).toBe(true);
    expect(["high", "medium", "low"]).toContain(parsed.confidence);
  });

  it("parses Dr/Cr PDF-style lines", () => {
    const text = "01/06/2026 UPI-SWIGGY 450.00 Dr\n02/06/2026 SALARY 85000.00 Cr";
    const { rows } = parseBankStatementText(text);
    expect(rows.some((r) => r.type === "debit" && r.amount === 450)).toBe(true);
    expect(rows.some((r) => r.type === "credit")).toBe(true);
  });

  it("generic fallback parses unknown bank format", () => {
    const text = `My Local Co-op
01/06/2026 GROCERY 1200.00 Dr
02/06/2026 FUEL 800.00 Dr
03/06/2026 SALARY 50000.00 Cr`;
    const parsed = parseBankStatementText(text);
    expect(parsed.bankDetected).toBe("generic");
    expect(parsed.rows.length).toBeGreaterThanOrEqual(3);
  });

  it("parses CSV with debit column", () => {
    const csv = "Date,Narration,Withdrawal,Deposit\n01/06/2026,NETFLIX,499.00,\n02/06/2026,SALARY,,85000.00";
    const rows = parseBankStatementCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].type).toBe("debit");
  });

  it("builds commitment drafts from recurring", () => {
    const drafts = recurringToCommitmentDrafts([
      { name: "NETFLIX", category: "Subscription", suggestedAmount: 499, occurrences: 3, lastDate: "2026-06-01" },
    ]);
    expect(drafts[0].repeatType).toBe("monthly");
  });

  it("finds recurring merchants", () => {
    const rows = [
      { date: "2026-05-01", amount: 499, description: "NETFLIX SUB", type: "debit" },
      { date: "2026-06-01", amount: 499, description: "NETFLIX SUB", type: "debit" },
      { date: "2026-07-01", amount: 499, description: "NETFLIX SUB", type: "debit" },
    ];
    const recurring = detectRecurringFromStatement(rows);
    expect(recurring.length).toBeGreaterThan(0);
    expect(recurring[0].category).toBe("Subscription");
  });
});
