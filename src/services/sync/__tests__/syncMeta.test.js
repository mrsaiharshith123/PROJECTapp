import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendBackupLog,
  loadBackupLog,
  loadSyncMeta,
  saveSyncMeta,
} from "../syncMeta.js";

const STORAGE = new Map();

beforeEach(() => {
  STORAGE.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k) => STORAGE.get(k) ?? null,
    setItem: (k, v) => STORAGE.set(k, v),
    removeItem: (k) => STORAGE.delete(k),
  });
  vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/120" });
  vi.stubGlobal("crypto", { randomUUID: () => "test-uuid-1234" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("syncMeta", () => {
  it("creates and persists device id", () => {
    const meta = loadSyncMeta();
    expect(meta.deviceId).toMatch(/^dev_/);
    expect(loadSyncMeta().deviceId).toBe(meta.deviceId);
  });

  it("appends backup log entries newest first", () => {
    appendBackupLog({
      type: "push",
      at: "2026-06-01T10:00:00.000Z",
      counts: { bills: 2, lending: 0, goals: 0, spends: 1 },
    });
    appendBackupLog({
      type: "restore",
      at: "2026-06-02T12:00:00.000Z",
      remoteDeviceId: "dev_remote",
      counts: { bills: 5, lending: 1, goals: 0, spends: 0 },
    });

    const log = loadBackupLog();
    expect(log).toHaveLength(2);
    expect(log[0].type).toBe("restore");
    expect(log[0].remoteDeviceId).toBe("dev_remote");
    expect(log[1].type).toBe("push");
    expect(log[1].counts?.bills).toBe(2);
  });

  it("merges partial patches via saveSyncMeta", () => {
    saveSyncMeta({ userId: "user-1", lastPushedAt: "2026-06-01T00:00:00.000Z" });
    saveSyncMeta({ lastPulledAt: "2026-06-02T00:00:00.000Z" });
    const meta = loadSyncMeta();
    expect(meta.userId).toBe("user-1");
    expect(meta.lastPushedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(meta.lastPulledAt).toBe("2026-06-02T00:00:00.000Z");
  });
});
