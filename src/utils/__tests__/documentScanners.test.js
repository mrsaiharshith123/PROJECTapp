import { describe, it, expect } from "vitest";
import { extractLoanSanctionData, extractInsurancePolicyData } from "../documentScanners.js";

describe("extractLoanSanctionData", () => {
  it("extracts principal, rate, tenure, and EMI from a typical sanction letter", () => {
    const text = `
      HDFC Bank
      Loan Sanction Letter
      Sanctioned Loan Amount: Rs. 5,00,000
      Rate of Interest: 8.5%
      Tenure: 60 months
      EMI: Rs. 10,258
      Home Loan approved
    `;
    const result = extractLoanSanctionData(text);
    expect(result.principal).toBe(500000);
    expect(result.interestRate).toBe(8.5);
    expect(result.tenureMonths).toBe(60);
    expect(result.emi).toBe(10258);
    expect(result.loanType).toBe("home_loan");
  });

  it("converts a years-based tenure to months", () => {
    const text = "Tenure: 5 years\nLoan Amount: Rs. 200000";
    expect(extractLoanSanctionData(text).tenureMonths).toBe(60);
  });

  it("never throws on empty or garbage input", () => {
    expect(() => extractLoanSanctionData("")).not.toThrow();
    expect(() => extractLoanSanctionData(undefined)).not.toThrow();
    const result = extractLoanSanctionData("random unrelated text");
    expect(result.principal).toBeNull();
    expect(result.loanType).toBe("personal_loan");
  });
});

describe("extractInsurancePolicyData", () => {
  it("extracts sum assured, premium, term, and policy number", () => {
    const text = `
      LIC Life Insurance
      Policy No: 123456789012
      Sum Assured: Rs. 10,00,000
      Premium Amount: Rs. 25,000
      Policy Term: 20 years
      Nominee: Priya Sharma
    `;
    const result = extractInsurancePolicyData(text);
    expect(result.sumAssured).toBe(1000000);
    expect(result.premium).toBe(25000);
    expect(result.termYears).toBe(20);
    expect(result.policyNumber).toBe("123456789012");
    expect(result.hasNominee).toBe(true);
    expect(result.nomineeName).toBe("Priya Sharma");
  });

  it("defaults to yearly frequency when not specified, and detects monthly when present", () => {
    expect(extractInsurancePolicyData("Sum Assured: Rs. 500000").frequency).toBe("yearly");
    expect(extractInsurancePolicyData("Monthly Premium: Rs. 2000").frequency).toBe("monthly");
  });

  it("never throws on empty input", () => {
    expect(() => extractInsurancePolicyData("")).not.toThrow();
    expect(extractInsurancePolicyData("").hasNominee).toBe(false);
  });
});
