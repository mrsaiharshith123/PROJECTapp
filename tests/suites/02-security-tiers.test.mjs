import { describe, it, expect } from "vitest";
import { isFeatureUnlocked, PRO_FEATURES, POWER_FEATURES } from "../../src/constants/subscriptionTiers.js";
import { canAddLendingRecord, canAddChitRecord, canAddGoal, tierHasFeature } from "../../src/utils/tierAccess.js";
import { SETTINGS, STATUS, makeLendings, makeChits, makeGoals } from "../fixtures.mjs";

describe("SECURITY: tier gate integrity", () => {
  it("[P0] unknown tier 'platinum' does NOT unlock Pro features", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, "platinum")).toBe(false);
    }
  });

  it("[P0] unknown tier 'admin' does NOT unlock Power features", () => {
    for (const feat of POWER_FEATURES) {
      expect(isFeatureUnlocked(feat, "admin")).toBe(false);
    }
  });

  it("[P0] empty string tier does NOT unlock any feature", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, "")).toBe(false);
    }
  });

  it("[P0] null tier does NOT unlock any feature", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, null)).toBe(false);
    }
  });

  it("[P0] undefined tier does NOT unlock any feature", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, undefined)).toBe(false);
    }
  });

  it("[P0] power-only features are NOT unlocked by Pro tier", () => {
    for (const feat of POWER_FEATURES) {
      expect(isFeatureUnlocked(feat, "pro")).toBe(false);
    }
  });

  it("[P1] free user hits lending limit at exactly 5 records", () => {
    expect(canAddLendingRecord(SETTINGS.free, makeLendings(4)).ok).toBe(true);
    const at5 = canAddLendingRecord(SETTINGS.free, makeLendings(5));
    expect(at5.ok).toBe(false);
    expect(at5.reason).toBe("lending_limit");
  });

  it("[P1] pro user can add more than 5 lending records", () => {
    expect(canAddLendingRecord(SETTINGS.pro, makeLendings(10)).ok).toBe(true);
    expect(canAddLendingRecord(SETTINGS.pro, makeLendings(100)).ok).toBe(true);
  });

  it("[P1] free user hits chit limit at exactly 2 records", () => {
    expect(canAddChitRecord(SETTINGS.free, makeChits(1), STATUS.pending).ok).toBe(true);
    const at2 = canAddChitRecord(SETTINGS.free, makeChits(2), STATUS.pending);
    expect(at2.ok).toBe(false);
    expect(at2.reason).toBe("chit_limit");
  });

  it("[P1] free user hits goal limit at exactly 3 goals", () => {
    expect(canAddGoal(SETTINGS.free, makeGoals(2)).ok).toBe(true);
    const at3 = canAddGoal(SETTINGS.free, makeGoals(3));
    expect(at3.ok).toBe(false);
    expect(at3.reason).toBe("goals_limit");
  });

  it("[P1] pro user can have more than 3 goals", () => {
    expect(canAddGoal(SETTINGS.pro, makeGoals(10)).ok).toBe(true);
  });

  it("[P1] ai_advisor is Pro-only (not Free)", () => {
    expect(isFeatureUnlocked("ai_advisor", "free")).toBe(false);
    expect(isFeatureUnlocked("ai_advisor", "pro")).toBe(true);
    expect(isFeatureUnlocked("ai_advisor", "power")).toBe(true);
  });

  it("[P1] legal_agreement is Pro-only", () => {
    expect(isFeatureUnlocked("legal_agreement", "free")).toBe(false);
    expect(isFeatureUnlocked("legal_agreement", "pro")).toBe(true);
  });

  it("[P1] bond_advisor is Power-only", () => {
    expect(isFeatureUnlocked("bond_advisor", "free")).toBe(false);
    expect(isFeatureUnlocked("bond_advisor", "pro")).toBe(false);
    expect(isFeatureUnlocked("bond_advisor", "power")).toBe(true);
  });

  it("[P2] tierHasFeature with settings object reads subscriptionTier correctly", () => {
    expect(tierHasFeature("unlimited_lending", SETTINGS.free)).toBe(false);
    expect(tierHasFeature("unlimited_lending", SETTINGS.pro)).toBe(true);
    expect(tierHasFeature("unlimited_lending", SETTINGS.power)).toBe(true);
  });
});
