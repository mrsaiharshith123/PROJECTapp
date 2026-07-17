import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@capgo/capacitor-updater", () => ({
  CapacitorUpdater: {
    current: vi.fn(),
  },
}));

// Keeps the APK-update branch out of the picture — these tests are about
// the OTA "already applied" logic only. Matching the remote's native
// semver means needsNativeApkUpdate() is always false here.
vi.mock("@capacitor/app", () => ({
  App: { getInfo: vi.fn().mockResolvedValue({ version: "2.0.0" }) },
}));

function makeMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

describe("checkForAppUpdate — stale applied-OTA record must not mask a real pending update", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;

  beforeEach(() => {
    vi.resetModules();
    globalThis.localStorage = makeMemoryStorage();
    globalThis.window = { ...originalWindow, Capacitor: { isNativePlatform: () => true } };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: "2.0.0", builtAt: "2026-07-18T00:00:00.000Z", bundleUrl: "https://x/bundle.zip" }),
    });
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.localStorage = originalLocalStorage;
    vi.restoreAllMocks();
  });

  it("still reports an update as needed when the live bundle never actually became current, even if a stale localStorage record claims it did", async () => {
    // Simulate the exact failure mode: an earlier OTA attempt optimistically
    // wrote an "applied" record for 2.0.0, but the bundle swap actually
    // failed/rolled back, so the live bundle Capgo reports is still 1.0.0.
    localStorage.setItem(
      "perovo_applied_ota",
      JSON.stringify({ version: "2.0.0", builtAt: "2026-07-18T00:00:00.000Z", appliedAt: "2026-07-18T00:01:00.000Z" }),
    );

    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    CapacitorUpdater.current.mockResolvedValue({ bundle: { version: "1.0.0", id: "old-bundle" } });

    const { checkForAppUpdate } = await import("../appUpdate.js");
    const result = await checkForAppUpdate();

    expect(result.status).not.toBe("current");
    expect(result.needsOta).toBe(true);
  });

  it("correctly reports current when the live bundle genuinely matches the remote version", async () => {
    localStorage.setItem(
      "perovo_applied_ota",
      JSON.stringify({ version: "2.0.0", builtAt: "2026-07-18T00:00:00.000Z", appliedAt: "2026-07-18T00:01:00.000Z" }),
    );

    const { CapacitorUpdater } = await import("@capgo/capacitor-updater");
    CapacitorUpdater.current.mockResolvedValue({ bundle: { version: "2.0.0", id: "new-bundle" } });

    const { checkForAppUpdate } = await import("../appUpdate.js");
    const result = await checkForAppUpdate();

    expect(result.status).toBe("current");
    expect(result.needsOta).toBe(false);
  });
});
