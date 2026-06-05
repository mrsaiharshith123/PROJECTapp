import { describe, expect, it } from "vitest";
import { numberToWords } from "../lendingAgreement.js";

describe("numberToWords", () => {
  it("handles zero", () => {
    expect(numberToWords(0)).toBe("Zero");
  });

  it("handles ones and tens", () => {
    expect(numberToWords(15)).toBe("Fifteen");
    expect(numberToWords(42)).toBe("Forty Two");
  });

  it("handles hundreds", () => {
    expect(numberToWords(250)).toBe("Two Hundred Fifty");
  });

  it("handles thousands", () => {
    expect(numberToWords(25000)).toBe("Twenty Five Thousand");
  });

  it("handles lakhs", () => {
    expect(numberToWords(150000)).toBe("One Lakh Fifty Thousand");
  });

  it("handles crores", () => {
    expect(numberToWords(12500000)).toBe("One Crore Twenty Five Lakh");
  });
});
