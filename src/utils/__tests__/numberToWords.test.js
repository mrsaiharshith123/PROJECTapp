import { describe, it, expect } from "vitest";
import { numberToWords } from "../numberToWords.js";

describe("numberToWords", () => {
  it("handles typical principal amounts", () => {
    expect(numberToWords(100000)).toMatch(/lakh/i);
    expect(numberToWords(0)).toBe("zero rupees only");
  });

  it("handles crores", () => {
    expect(numberToWords(15000000)).toMatch(/crore/i);
  });

  it("never crashes on invalid input", () => {
    expect(numberToWords(null)).toBe("zero rupees only");
    expect(numberToWords(undefined)).toBe("zero rupees only");
    expect(numberToWords(NaN)).toBe("zero rupees only");
    expect(numberToWords(-5000)).not.toBe("");
  });
});
