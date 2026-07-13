import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  allEssentialPermissionsGranted,
  anyEssentialPermissionDenied,
  checkEssentialPermissions,
} from "../nativePermissions.js";

describe("allEssentialPermissionsGranted / anyEssentialPermissionDenied", () => {
  it("requires all four granted", () => {
    const full = { notifications: "granted", camera: "granted", photos: "granted", location: "granted" };
    expect(allEssentialPermissionsGranted(full)).toBe(true);
    expect(allEssentialPermissionsGranted({ ...full, camera: "prompt" })).toBe(false);
  });

  it("flags any explicit denial", () => {
    const full = { notifications: "granted", camera: "granted", photos: "granted", location: "granted" };
    expect(anyEssentialPermissionDenied(full)).toBe(false);
    expect(anyEssentialPermissionDenied({ ...full, location: "denied" })).toBe(true);
    // "unsupported"/"prompt" (e.g. from a timed-out check) is not a denial.
    expect(anyEssentialPermissionDenied({ ...full, location: "unsupported" })).toBe(false);
  });
});

describe("checkEssentialPermissions — non-native environment", () => {
  it("returns unsupported for everything without throwing when there's no Capacitor bridge", async () => {
    const status = await checkEssentialPermissions();
    expect(status).toEqual({
      notifications: "unsupported",
      camera: "unsupported",
      photos: "unsupported",
      location: "unsupported",
    });
  });
});

describe("checkEssentialPermissions — 'previously fully granted' recovery", () => {
  const store = new Map();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not re-block the user when a later check merely times out/errors (no explicit denial) after a prior full grant", async () => {
    // Simulate: this device previously proved every permission was granted.
    store.set("perovo_native_perms_ever_granted_v1", "1");

    // Without a native Capacitor bridge, checkNativePermission always
    // resolves "unsupported" (not "denied") for each kind — exactly the
    // shape a transient post-OTA-reload bridge hiccup would produce: no
    // permission is denied, but nothing came back "granted" either.
    const status = await checkEssentialPermissions();

    // The bug this regression guards: before the fix, this device would be
    // sent back through the full permission-request gate despite already
    // having proven every permission was granted — and the "Allow" button
    // could hang forever with no timeout. Now a prior full grant plus zero
    // explicit denials is trusted instead of re-blocking the user.
    expect(allEssentialPermissionsGranted(status)).toBe(true);
  });
});
