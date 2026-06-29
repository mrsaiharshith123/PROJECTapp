import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SRC = join(process.cwd(), "src");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === "__tests__") continue;
      walk(p, acc);
    } else if (/\.(jsx?|tsx?)$/.test(name)) {
      acc.push(p);
    }
  }
  return acc;
}

describe("ARCHITECTURE: app update manifest", () => {
  it("[P1] same semver + newer builtAt counts as an update", async () => {
    const { isRemoteManifestNewer } = await import("../../src/utils/updateServer.js");
    const remote = { version: "1.5.0", builtAt: "2026-06-30T00:00:00.000Z" };
    expect(isRemoteManifestNewer(remote, "1.5.0", "2026-06-29T00:00:00.000Z")).toBe(true);
    expect(isRemoteManifestNewer(remote, "1.5.0", "")).toBe(true);
    expect(isRemoteManifestNewer(remote, "1.5.0", "2026-06-30T01:00:00.000Z")).toBe(false);
    expect(isRemoteManifestNewer({ version: "1.6.0" }, "1.5.0", "")).toBe(true);
  });
});

describe("ARCHITECTURE: sync governance", () => {
  it("[P1] sync engine and snapshot guards exist", async () => {
    const sync = await import("../../src/services/sync/syncEngine.js");
    const snap = await import("../../src/storage/snapshotData.js");
    expect(typeof sync.pushLocalSnapshotToCloud).toBe("function");
    expect(typeof sync.pullRemoteSnapshotToLocal).toBe("function");
    expect(typeof snap.snapshotHasUserData).toBe("function");
    expect(typeof snap.localStateHasUserData).toBe("function");
  });

  it("[P1] feature pages do not import @supabase/supabase-js directly", () => {
    const files = walk(join(SRC, "ui/features"));
    const violations = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (/@supabase\/supabase-js/.test(text)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });

  it("[P2] engines folder has no React imports", () => {
    const files = walk(join(SRC, "engines"));
    const violations = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (/from\s+["']react["']/.test(text)) violations.push(file);
    }
    expect(violations).toEqual([]);
  });
});
