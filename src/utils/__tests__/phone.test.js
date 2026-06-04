import { describe, expect, it } from "vitest";
import { formatIndianPhoneDisplay, isValidIndianPhone, normalizeIndianPhone } from "../phone.js";

describe("phone", () => {
  it("normalizes +91 prefix", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
  });

  it("validates Indian mobile", () => {
    expect(isValidIndianPhone("9876543210")).toBe(true);
    expect(isValidIndianPhone("5876543210")).toBe(false);
    expect(isValidIndianPhone("98765")).toBe(false);
  });

  it("formats for display", () => {
    expect(formatIndianPhoneDisplay("9876543210")).toBe("+91 98765 43210");
  });
});
