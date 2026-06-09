import { describe, it, expect } from "vitest";
import {
  parseBankStatementText,
  parseBankStatementCsv,
  detectRecurringFromStatement,
  recurringToCommitmentDrafts,
} from "../bankStatementParser.js";

describe("bankStatementParser", () => {
  it("detects HDFC bank and parses debit rows", () => {
    const text = `HDFC Bank Statement
01/06/2026 NETFLIX SUBSCRIPTION 499.00
15/06/2026 SALARY CREDIT 85000.00
02/07/2026 NETFLIX SUBSCRIPTION 499.00`;
    const { rows, bank } = parseBankStatementText(text);
    expect(bank).toBe("hdfc");
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.type === "debit")).toBe(true);
  });

  it("parses Dr/Cr PDF-style lines", () => {
    const text = "01/06/2026 UPI-SWIGGY 450.00 Dr\n02/06/2026 SALARY 85000.00 Cr";
    const { rows } = parseBankStatementText(text);
    expect(rows.some((r) => r.type === "debit" && r.amount === 450)).toBe(true);
    expect(rows.some((r) => r.type === "credit")).toBe(true);
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
