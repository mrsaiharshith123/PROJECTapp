import { describe, it, expect } from "vitest";
import { isFeatureUnlocked, PRO_FEATURES } from "../../src/constants/subscriptionTiers.js";
import { canAddLendingRecord, canAddChitRecord, canAddGoal, tierHasFeature } from "../../src/utils/tierAccess.js";
import { SETTINGS, STATUS, makeLendings, makeChits, makeGoals } from "../fixtures.mjs";

describe("SECURITY: tier gate integrity", () => {
  it("[P0] unknown tier 'platinum' does NOT unlock Pro features", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, "platinum")).toBe(false);
    }
  });

  it("[P0] unknown tier 'admin' does NOT unlock Pro features", () => {
    for (const feat of PRO_FEATURES) {
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

  it("[P0] Pro tier unlocks all Pro-gated features", () => {
    for (const feat of PRO_FEATURES) {
      expect(isFeatureUnlocked(feat, "pro")).toBe(true);
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

  it("[P1] bond_advisor is Pro-only", () => {
    expect(isFeatureUnlocked("bond_advisor", "free")).toBe(false);
    expect(isFeatureUnlocked("bond_advisor", "pro")).toBe(true);
    expect(isFeatureUnlocked("bond_advisor", "power")).toBe(true);
  });

  it("[P2] tierHasFeature with settings object reads subscriptionTier correctly", () => {
    expect(tierHasFeature("unlimited_lending", SETTINGS.free)).toBe(false);
    expect(tierHasFeature("unlimited_lending", SETTINGS.pro)).toBe(true);
    expect(tierHasFeature("unlimited_lending", SETTINGS.power)).toBe(true);
  });
});

describe("SECURITY: device sessions", () => {
  it("[P1] parses Windows + Chrome versions from user agent", async () => {
    const { parseDeviceInfo } = await import("../../src/utils/deviceInfo.js");
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.114 Safari/537.36";
    const info = parseDeviceInfo(ua);
    expect(info.os.family).toBe("windows");
    expect(info.os.name).toContain("Windows");
    expect(info.browser.family).toBe("chrome");
    expect(info.browser.name).toBe("Chrome 126");
    expect(info.label).toBe("Windows 10/11 · Chrome 126");
  });

  it("[P1] dedupes duplicate Windows Chrome sessions to one row", async () => {
    const { dedupeSessionRows, findStaleSessionDeviceIds } = await import("../../src/utils/deviceInfo.js");
    const rows = [
      { device_id: "a", device_label: "Windows · Chrome", last_active_at: "2026-06-27T00:14:00Z" },
      { device_id: "b", device_label: "Windows · Chrome", last_active_at: "2026-06-27T00:15:00Z" },
      { device_id: "c", device_label: "Windows 11 · Chrome 126", last_active_at: "2026-06-27T00:13:00Z" },
    ];
    const deduped = dedupeSessionRows(rows, "b");
    expect(deduped).toHaveLength(1);
    expect(deduped[0].device_id).toBe("b");
    expect(findStaleSessionDeviceIds(rows, "b").sort()).toEqual(["a", "c"]);
  });
});
