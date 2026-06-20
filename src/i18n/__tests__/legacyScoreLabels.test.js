import { describe, expect, it } from "vitest";
import { applyLegacyScoreTaxonomy, isLegacyScoreHidden } from "../legacyScoreLabels.js";

describe("legacyScoreLabels", () => {
  it("hides pressureAdvanced from detail UI", () => {
    expect(isLegacyScoreHidden("pressureAdvanced")).toBe(true);
  });

  it("filters hidden scores and remaps titles to pillars", () => {
    const rows = applyLegacyScoreTaxonomy([
      { id: "pressure", titleKey: "profileHub.widget.pressure", value: "40/100" },
      { id: "flexibility", titleKey: "profileHub.widget.flexibility", value: "50/100" },
      {
        id: "health",
        titleKey: "profileHub.widget.health",
        value: "70/100",
        subScores: [{ labelKey: "netWorth.lifeScore.title", value: "60/100" }],
      },
    ]);
    expect(rows.map((r) => r.id)).toEqual(["pressure", "health"]);
    expect(rows[0].titleKey).toBe("perovoScore.pillar.cashflow");
    expect(rows[1].titleKey).toBe("perovoScore.pillar.protection");
    expect(rows[1].subScores).toEqual([]);
  });
});
