import { describe, expect, it } from "vitest";
import {
  generateLendingProfileShareCardHtml,
  lendingProfileSharePlainText,
} from "../lendingProfileShare.js";

describe("lendingProfileShare", () => {
  const sample = {
    displayName: "Harsha",
    lentTotal: 10000,
    borrowedTotal: 5000,
    lentOutstanding: 2000,
    borrowedOutstanding: 1000,
    trustScore: 72,
    activeDeals: 3,
  };

  it("formats plain-text share card with trust score", () => {
    const text = lendingProfileSharePlainText(sample);
    expect(text).toContain("Harsha — Lending profile");
    expect(text).toContain("Trust score: 72/100");
    expect(text).toContain("Active deals: 3");
    expect(text).toContain("₹10,000");
  });

  it("uses dash for trust when score is null", () => {
    const text = lendingProfileSharePlainText({ ...sample, trustScore: null });
    expect(text).toContain("Trust score: —");
  });

  it("generates HTML share card with totals", () => {
    const html = generateLendingProfileShareCardHtml(sample);
    expect(html).toContain("Harsha");
    expect(html).toContain("72/100");
    expect(html).toContain("Still to recover");
  });
});
