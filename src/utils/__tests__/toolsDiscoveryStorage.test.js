import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dismissToolsNudge, isToolsNudgeDismissed } from "../toolsDiscoveryStorage.js";

const STORAGE_KEY = "perovo_tools_nudge_dismissed";
const SESSION_KEY = "perovo_tools_nudge_session";

function mockStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", mockStorage());
  vi.stubGlobal("sessionStorage", mockStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toolsDiscoveryStorage", () => {
  it("returns false when nothing stored", () => {
    expect(isToolsNudgeDismissed()).toBe(false);
  });

  it("migrates legacy permanent dismiss flag", () => {
    localStorage.setItem(STORAGE_KEY, "1");
    expect(isToolsNudgeDismissed()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("honors recent timestamp dismiss", () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    expect(isToolsNudgeDismissed()).toBe(true);
  });

  it("expires old timestamp dismiss", () => {
    const eightDaysAgo = Date.now() - 8 * 86400000;
    localStorage.setItem(STORAGE_KEY, String(eightDaysAgo));
    expect(isToolsNudgeDismissed()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("dismiss sets session and timestamp", () => {
    dismissToolsNudge();
    expect(sessionStorage.getItem(SESSION_KEY)).toBe("1");
    expect(Number(localStorage.getItem(STORAGE_KEY))).toBeGreaterThan(0);
    expect(isToolsNudgeDismissed()).toBe(true);
  });
});
