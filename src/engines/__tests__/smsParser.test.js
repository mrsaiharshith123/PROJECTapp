import { describe, expect, it } from "vitest";
import { parseSmsForDebit } from "../smsParser.js";

describe("parseSmsForDebit", () => {
  it("parses account debited format", () => {
    const r = parseSmsForDebit(
      "Your a/c XXXX1234 is debited for Rs.5,000.00 on 04-Jun-2026",
    );
    expect(r).not.toBeNull();
    expect(r.amount).toBe(5000);
    expect(r.last4).toBe("1234");
  });

  it("parses INR debited from HDFC format", () => {
    const r = parseSmsForDebit("INR 5,000.00 debited from HDFC Bank a/c ending 1234");
    expect(r?.amount).toBe(5000);
    expect(r?.bank).toMatch(/HDFC/i);
  });

  it("parses SBI format", () => {
    const r = parseSmsForDebit("Debited INR 8000 from SBI A/C ****5678 on 04/06/26");
    expect(r?.amount).toBe(8000);
    expect(r?.last4).toBe("5678");
  });

  it("parses Axis NACH format", () => {
    const r = parseSmsForDebit(
      "Rs 1200 debited from your Axis Bank account XX9012 for NACH payment",
    );
    expect(r?.amount).toBe(1200);
    expect(r?.bank).toMatch(/Axis/i);
  });

  it("returns null for non-debit SMS", () => {
    expect(parseSmsForDebit("Your OTP is 123456")).toBeNull();
  });
});
