import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadSettingsFromStorage } from "../migrateStorage.js";

function createStorage() {
  /** @type {Record<string, string>} */
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
}

describe("loadSettingsFromStorage — removed modes", () => {
  const key = "perovo_settings";

  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("migrates freelancer to salaried", () => {
    localStorage.setItem(
      key,
      JSON.stringify({ userMode: "freelancer", monthlyIncome: 50000, onboardingComplete: true }),
    );
    const s = loadSettingsFromStorage();
    expect(s.userMode).toBe("salaried");
  });

  it("migrates student to salaried", () => {
    localStorage.setItem(key, JSON.stringify({ userMode: "student", monthlyIncome: 8000 }));
    const s = loadSettingsFromStorage();
    expect(s.userMode).toBe("salaried");
  });

  it("migrates business to salaried", () => {
    localStorage.setItem(key, JSON.stringify({ userMode: "business", monthlyIncome: 120000 }));
    const s = loadSettingsFromStorage();
    expect(s.userMode).toBe("salaried");
  });

  it("merges removed mode tool order into salaried", () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        userMode: "freelancer",
        dashboardToolOrderByMode: { freelancer: ["goals", "afford"], salaried: ["emi"] },
      }),
    );
    const s = loadSettingsFromStorage();
    expect(s.userMode).toBe("salaried");
    expect(s.dashboardToolOrderByMode.freelancer).toBeUndefined();
    expect(s.dashboardToolOrderByMode.salaried).toEqual(["loan", "planner"]);
  });
});
