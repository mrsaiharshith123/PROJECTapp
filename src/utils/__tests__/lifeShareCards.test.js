import { describe, it, expect } from "vitest";
import {
  generateLifeScoreShareCardHtml,
  lifeScoreSharePlainText,
  generateSurvivalShareCardHtml,
} from "../lifeShareCards.js";

describe("lifeShareCards", () => {
  it("renders life score HTML without leaking raw HTML", () => {
    const html = generateLifeScoreShareCardHtml({
      healthScore: 72,
      healthLabel: "Good",
      pressureScore: 45,
      pressureLabel: "Manageable",
      survivalMonths: 6,
      survivalLabel: "Stable",
      displayName: "<script>",
    });
    expect(html).toContain("72/100");
    expect(html).not.toContain("<script>");
  });

  it("formats plain text snapshot", () => {
    const text = lifeScoreSharePlainText({
      healthScore: 80,
      healthLabel: "Strong",
      pressureScore: 30,
      pressureLabel: "Low",
      survivalMonths: 8,
    });
    expect(text).toMatch(/Health: 80/);
    expect(text).toMatch(/Pressure: 30/);
  });

  it("renders survival share card", () => {
    const html = generateSurvivalShareCardHtml({
      survivalMonths: 5,
      tierLabel: "Moderate",
      classification: "building buffer",
    });
    expect(html).toContain("5");
    expect(html).toContain("Moderate");
  });
});
