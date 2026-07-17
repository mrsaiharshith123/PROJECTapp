import { describe, it, expect } from "vitest";
import { phoneLast10, phoneNumbersMatch } from "../sanitize.js";

describe("phoneLast10", () => {
  it("keeps only the last 10 digits, stripping spaces/dashes/country code", () => {
    expect(phoneLast10("+91 98765 43210")).toBe("9876543210");
    expect(phoneLast10("091-98765-43210")).toBe("9876543210");
    expect(phoneLast10("9876543210")).toBe("9876543210");
  });

  it("returns whatever digits exist when fewer than 10", () => {
    expect(phoneLast10("12345")).toBe("12345");
    expect(phoneLast10("")).toBe("");
  });
});

describe("phoneNumbersMatch", () => {
  it("matches numbers written with different country-code/formatting conventions", () => {
    expect(phoneNumbersMatch("+91 98765 43210", "9876543210")).toBe(true);
    expect(phoneNumbersMatch("09876543210", "+919876543210")).toBe(true);
  });

  it("rejects genuinely different numbers", () => {
    expect(phoneNumbersMatch("9876543210", "9876543211")).toBe(false);
  });

  it("rejects when either side has fewer than 10 digits (no partial-match bypass)", () => {
    expect(phoneNumbersMatch("43210", "9876543210")).toBe(false);
    expect(phoneNumbersMatch("", "")).toBe(false);
  });
});
