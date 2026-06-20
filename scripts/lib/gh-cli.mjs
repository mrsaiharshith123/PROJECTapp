import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** Windows npm often inherits a stale PATH — merge Machine + User PATH. */
export function envWithFreshPath(base = process.env) {
  if (process.platform !== "win32") return base;
  try {
    const machine = spawnSync(
      "powershell",
      ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('Path','Machine')"],
      { encoding: "utf8" },
    ).stdout?.trim();
    const user = spawnSync(
      "powershell",
      ["-NoProfile", "-Command", "[Environment]::GetEnvironmentVariable('Path','User')"],
      { encoding: "utf8" },
    ).stdout?.trim();
    return { ...base, Path: [machine, user, base.Path].filter(Boolean).join(";") };
  } catch {
    return base;
  }
}

/** Resolve gh.exe — winget installs to Program Files even when PATH is stale. */
export function resolveGhExe(env = envWithFreshPath()) {
  if (env.GH_PATH && fs.existsSync(env.GH_PATH)) return env.GH_PATH;
  if (process.platform === "win32") {
    const candidates = [
      path.join(env.ProgramFiles || "C:\\Program Files", "GitHub CLI", "gh.exe"),
      path.join(env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "GitHub CLI", "gh.exe"),
      path.join(env.LOCALAPPDATA || "", "Programs", "GitHub CLI", "gh.exe"),
    ];
    for (const p of candidates) {
      if (p && fs.existsSync(p)) return p;
    }
  }
  return "gh";
}

export function runGh(args, opts = {}) {
  const env = envWithFreshPath(opts.env);
  const gh = resolveGhExe(env);
  return spawnSync(gh, args, {
    cwd: opts.cwd,
    encoding: opts.encoding ?? "utf8",
    stdio: opts.stdio ?? "inherit",
    shell: false,
    env,
  });
}
