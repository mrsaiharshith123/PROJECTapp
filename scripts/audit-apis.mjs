#!/usr/bin/env node
/**
 * Perovo — integration / API env audit.
 *
 *   npm run audit:apis              # config + code vs .env (no network)
 *   npm run audit:apis -- --live    # also ping APIs where safe
 *   npm run audit:apis -- --strict  # fail if any wired feature lacks env
 *   npm run audit:apis -- --json    # machine output for audit-all
 */
import "./loadDotEnv.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const STRICT = args.includes("--strict");
const JSON_OUT = args.includes("--json");

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function paint(c, t) {
  return `${c}${t}${C.reset}`;
}

/** @param {string} key */
function envVal(key) {
  return String(process.env[key] ?? "").trim();
}

/** @param {string} val */
function isPlaceholder(val) {
  if (!val) return true;
  const lower = val.toLowerCase();
  if (/xxxx|your_|replace_with|paste_here|_here$|changeme|example\.com\/your/i.test(val)) return true;
  if (lower === "your-project-ref.supabase.co") return true;
  if (lower === "your_supabase_anon_key") return true;
  if (val === "sk-ant-your_key_here") return true;
  return false;
}

/** @param {string} val */
function mask(val) {
  if (!val) return "(empty)";
  if (val.length < 10) return "(set, short)";
  return `${val.slice(0, 6)}…${val.slice(-4)}`;
}

/** @param {string} filePath */
function fileExists(filePath) {
  return fs.existsSync(path.join(ROOT, filePath));
}

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   tier: "core" | "feature" | "script" | "deploy",
 *   feature: string,
 *   envKeys: { key: string, required: boolean, hint?: string }[],
 *   codeFiles: string[],
 *   edgeFunction?: string,
 *   fallback?: string,
 *   validate?: (env: Record<string, string>) => { ok: boolean, note: string },
 *   probe?: (env: Record<string, string>) => Promise<{ ok: boolean, note: string }>,
 * }} IntegrationDef
 */

/** @type {IntegrationDef[]} */
const INTEGRATIONS = [
  {
    id: "supabase",
    label: "Supabase",
    tier: "core",
    feature: "Account backup, auth, edge functions",
    envKeys: [
      { key: "VITE_SUPABASE_URL", required: true },
      { key: "VITE_SUPABASE_ANON_KEY", required: true },
    ],
    codeFiles: ["src/services/supabase/auth.js", "src/services/sync/syncEngine.js"],
    validate: (env) => {
      const url = env.VITE_SUPABASE_URL || "";
      if (!url.includes("supabase.co")) return { ok: false, note: "URL should be *.supabase.co" };
      return { ok: true, note: "URL format OK" };
    },
    probe: async (env) => {
      const url = (env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
      const key = env.VITE_SUPABASE_ANON_KEY;
      if (!url || !key) return { ok: false, note: "missing url or anon key" };
      try {
        const res = await fetch(`${url}/auth/v1/health`, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          signal: AbortSignal.timeout(12_000),
        });
        return res.ok
          ? { ok: true, note: `reachable (${res.status})` }
          : { ok: false, note: `health HTTP ${res.status}` };
      } catch (e) {
        return { ok: false, note: e instanceof Error ? e.message : "network error" };
      }
    },
  },
  {
    id: "razorpay",
    label: "Razorpay",
    tier: "feature",
    feature: "Pro / Power subscription checkout",
    envKeys: [{ key: "VITE_RAZORPAY_KEY_ID", required: true }],
    codeFiles: ["src/services/razorpayConfig.js", "src/services/razorpaySubscription.js"],
    edgeFunction: "razorpay-checkout",
    fallback: "Dev simulate: VITE_SIMULATE_PAYMENTS=true",
    validate: (env) => {
      const id = env.VITE_RAZORPAY_KEY_ID || "";
      if (!id.startsWith("rzp_test_") && !id.startsWith("rzp_live_")) {
        return { ok: false, note: "key should start with rzp_test_ or rzp_live_" };
      }
      return { ok: true, note: id.startsWith("rzp_test_") ? "test mode" : "live mode" };
    },
  },
  {
    id: "razorpay-edge",
    label: "Razorpay edge secrets",
    tier: "deploy",
    feature: "Server-side checkout (Supabase secrets, not .env)",
    envKeys: [],
    codeFiles: ["supabase/functions/razorpay-checkout/index.ts"],
    validate: () => ({
      ok: fileExists("supabase/functions/razorpay-checkout/index.ts"),
      note: "Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in Supabase → Edge Functions → secrets",
    }),
  },
  {
    id: "leegality",
    label: "Leegality eSign",
    tier: "deploy",
    feature: "Aadhaar eSign on lending agreements (edge secrets only)",
    envKeys: [],
    codeFiles: ["src/services/lending/leegalityESign.js"],
    edgeFunction: "api-proxy",
    validate: () => ({
      ok: fileExists("supabase/functions/api-proxy/index.ts"),
      note: "Set LEEGALITY_BASE_URL + LEEGALITY_API_TOKEN in Supabase edge secrets",
    }),
  },
  {
    id: "surepass",
    label: "Surepass KYC",
    tier: "deploy",
    feature: "PAN / bank verification in lending (edge secrets only)",
    envKeys: [],
    codeFiles: ["src/services/lending/kycVerification.js"],
    edgeFunction: "api-proxy",
    validate: () => ({
      ok: fileExists("supabase/functions/api-proxy/index.ts"),
      note: "Set SUREPASS_TOKEN in Supabase edge secrets",
    }),
  },
  {
    id: "google-vision",
    label: "Google Cloud Vision",
    tier: "deploy",
    feature: "Bill scanner OCR (high accuracy via edge secrets)",
    envKeys: [],
    codeFiles: ["src/services/ocr/googleVision.js", "src/utils/billOcr.js"],
    edgeFunction: "api-proxy",
    validate: () => ({
      ok: fileExists("supabase/functions/api-proxy/index.ts"),
      note: "Set GOOGLE_VISION_API_KEY in Supabase edge secrets",
    }),
  },
  {
    id: "gold-api",
    label: "GoldAPI.io",
    tier: "deploy",
    feature: "Auto gold rate for net worth (edge secrets only)",
    envKeys: [],
    codeFiles: ["src/services/market/goldPrice.js"],
    edgeFunction: "api-proxy",
    fallback: "Manual gold rate in settings",
    validate: () => ({
      ok: fileExists("supabase/functions/api-proxy/index.ts"),
      note: "Set GOLD_API_KEY in Supabase edge secrets",
    }),
  },
  {
    id: "gemini",
    label: "Google Gemini (asset-insight + financial-advisor)",
    tier: "deploy",
    feature: "Live asset analysis + AI advisor — Supabase edge secrets",
    envKeys: [{ key: "GOOGLE_GEMINI_API_KEY", required: false, hint: "Set in Supabase secrets, not .env" }],
    codeFiles: [
      "src/services/ai/assetInsight.js",
      "src/services/financialAdvisor.js",
      "supabase/functions/asset-insight/index.ts",
      "supabase/functions/financial-advisor/index.ts",
    ],
    edgeFunction: "asset-insight",
  },
  {
    id: "anthropic",
    label: "Anthropic Claude (i18n translation scripts only — dev use)",
    tier: "script",
    feature: "npm run i18n:translate / i18n:fix — not bundled in app",
    envKeys: [{ key: "ANTHROPIC_API_KEY", required: false }],
    codeFiles: ["scripts/i18n-auto-translate.mjs", "scripts/i18n-fix-financial-terms.mjs"],
  },
  {
    id: "sentry",
    label: "Sentry",
    tier: "feature",
    feature: "Error tracking",
    envKeys: [
      { key: "VITE_SENTRY_DSN", required: true },
      { key: "VITE_SENTRY_ENABLE_DEV", required: false, hint: "1 to test in dev" },
    ],
    codeFiles: ["src/renderApp.jsx", "src/ui/layout/ErrorBoundary.jsx"],
    validate: (env) => {
      const dsn = env.VITE_SENTRY_DSN || "";
      if (!dsn.includes("sentry.io") && !dsn.includes("ingest.")) {
        return { ok: false, note: "DSN format unexpected" };
      }
      return { ok: true, note: "DSN set" };
    },
  },
  {
    id: "posthog",
    label: "PostHog",
    tier: "feature",
    feature: "Product analytics (production builds only)",
    envKeys: [
      { key: "VITE_POSTHOG_KEY", required: true },
      { key: "VITE_POSTHOG_HOST", required: false },
    ],
    codeFiles: ["src/renderApp.jsx"],
  },
  {
    id: "ota-update",
    label: "OTA / APK updates",
    tier: "feature",
    feature: "Profile → Update app",
    envKeys: [
      { key: "VITE_UPDATE_SERVER_URL", required: false },
      { key: "VITE_APK_DOWNLOAD_URL", required: false },
    ],
    codeFiles: ["src/services/appUpdate.js", "src/utils/updateServer.js"],
    fallback: "Defaults to GitHub Pages / same origin",
  },
  {
    id: "financial-advisor",
    label: "Financial advisor (edge)",
    tier: "deploy",
    feature: "AI advisor chat — needs Supabase + deployed function",
    envKeys: [],
    codeFiles: ["src/services/financialAdvisor.js"],
    edgeFunction: "financial-advisor",
  },
];

/** @returns {Set<string>} */
function parseExampleKeys() {
  const p = path.join(ROOT, ".env.example");
  if (!fs.existsSync(p)) return new Set();
  const keys = new Set();
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([A-Z0-9_]+)=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

/** @returns {Set<string>} */
function scanCodeEnvKeys() {
  const keys = new Set();
  const dirs = ["src", "scripts"];
  const re = /(?:import\.meta\.env\.|process\.env\.)(VITE_[A-Z0-9_]+|[A-Z][A-Z0-9_]+)/g;

  /** @param {string} dir */
  function walk(dir) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return;
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      const rel = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === "node_modules" || ent.name === "dist") continue;
        walk(rel);
        continue;
      }
      if (!/\.(js|jsx|ts|tsx|mjs)$/.test(ent.name)) continue;
      const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
      let m;
      while ((m = re.exec(text))) keys.add(m[1]);
    }
  }
  for (const d of dirs) walk(d);
  return keys;
}

/**
 * @param {IntegrationDef} def
 * @param {Record<string, string>} env
 */
function assessIntegration(def, env) {
  const codePresent = def.codeFiles.every((f) => fileExists(f));
  const missingFiles = def.codeFiles.filter((f) => !fileExists(f));

  /** @type {{ key: string, status: string, masked: string }[]} */
  const keyStates = [];
  let configured = true;
  let placeholder = false;

  for (const { key, required } of def.envKeys) {
    const val = env[key] || "";
    const ph = isPlaceholder(val);
    let status = "ok";
    if (!val) {
      status = required ? "missing" : "optional-empty";
      if (required) configured = false;
    } else if (ph) {
      status = "placeholder";
      placeholder = true;
      if (required) configured = false;
    }
    keyStates.push({ key, status, masked: mask(val) });
  }

  if (def.envKeys.length === 0 && def.tier === "deploy") {
    configured = codePresent;
  }

  let validateNote = "";
  if (configured && def.validate) {
    const v = def.validate(env);
    if (!v.ok) {
      configured = false;
      validateNote = v.note;
    } else {
      validateNote = v.note;
    }
  } else if (def.validate && def.envKeys.some((k) => env[k.key] && !isPlaceholder(env[k.key]))) {
    const v = def.validate(env);
    validateNote = v.note;
    if (!v.ok) configured = false;
  }

  let status = "not_configured";
  if (!codePresent) status = "no_code";
  else if (configured) status = "configured";
  else if (placeholder) status = "placeholder";
  else if (def.envKeys.length === 0) status = codePresent ? "deploy_only" : "no_code";
  else status = "missing_env";

  if (def.envKeys.length === 0 && def.tier === "feature") status = "n/a";

  return {
    id: def.id,
    label: def.label,
    tier: def.tier,
    feature: def.feature,
    status,
    configured,
    codePresent,
    missingFiles,
    keyStates,
    validateNote,
    fallback: def.fallback || null,
    edgeFunction: def.edgeFunction || null,
    envKeys: def.envKeys.map((k) => k.key),
  };
}

/**
 * @param {IntegrationDef} def
 * @param {Record<string, string>} env
 */
async function liveProbe(def, env) {
  if (!def.probe) return { ok: null, note: "no probe" };
  if (!def.envKeys.every((k) => !k.required || (env[k.key] && !isPlaceholder(env[k.key])))) {
    return { ok: false, note: "skipped — env incomplete" };
  }
  return def.probe(env);
}

function overallStatus(row, live) {
  if (row.status === "no_code") return { code: "NO_CODE", level: "warn" };
  if (row.status === "missing_env" || row.status === "placeholder") {
    return { code: "MISSING_ENV", level: row.tier === "core" ? "error" : STRICT ? "error" : "warn" };
  }
  if (row.status === "configured" || row.status === "deploy_only") {
    if (live?.ok === false) return { code: "LIVE_FAIL", level: "error" };
    if (live?.ok === true) return { code: "LIVE_OK", level: "ok" };
    return { code: "CONFIGURED", level: "ok" };
  }
  if (row.status === "not_configured") {
    return { code: "OFF", level: row.tier === "core" ? "error" : "info" };
  }
  return { code: row.status.toUpperCase(), level: "info" };
}

async function main() {
  const env = /** @type {Record<string, string>} */ ({ ...process.env });
  const exampleKeys = parseExampleKeys();
  const codeKeys = scanCodeEnvKeys();

  const registryKeys = new Set();
  for (const def of INTEGRATIONS) {
    for (const k of def.envKeys) registryKeys.add(k.key);
  }

  const undocumentedInExample = [...codeKeys].filter(
    (k) => (k.startsWith("VITE_") || k === "ANTHROPIC_API_KEY") && !exampleKeys.has(k),
  );
  const inExampleNotRegistry = [...exampleKeys].filter((k) => !registryKeys.has(k) && k.startsWith("VITE_"));

  /** @type {Awaited<ReturnType<typeof assessIntegration>>[]} */
  const rows = INTEGRATIONS.map((def) => assessIntegration(def, env));

  /** @type {{ id: string, ok: boolean | null, note: string }[]} */
  const liveResults = [];
  if (LIVE) {
    for (const def of INTEGRATIONS) {
      const live = await liveProbe(def, env);
      liveResults.push({ id: def.id, ok: live.ok, note: live.note });
    }
  }

  const liveById = Object.fromEntries(liveResults.map((r) => [r.id, r]));

  let errors = 0;
  let warnings = 0;

  /** @type {object[]} */
  const report = [];

  for (const row of rows) {
    const live = liveById[row.id];
    const overall = overallStatus(row, live);
    if (overall.level === "error") errors += 1;
    if (overall.level === "warn") warnings += 1;
    report.push({ ...row, overall: overall.code, level: overall.level, live });
  }

  if (undocumentedInExample.length) warnings += 1;
  if (inExampleNotRegistry.length) warnings += 1;

  if (JSON_OUT) {
    console.log(
      JSON.stringify({
        ok: errors === 0,
        errors,
        warnings,
        live: LIVE,
        strict: STRICT,
        integrations: report,
        undocumentedInExample,
        inExampleNotRegistry,
      }),
    );
    process.exit(errors > 0 ? 1 : 0);
  }

  console.log(
    paint(
      C.bold + C.cyan,
      `\n╔══════════════════════════════════════════════════════════╗\n║  API & integration audit — Perovo                          ║\n╚══════════════════════════════════════════════════════════╝`,
    ),
  );
  console.log(
    paint(
      C.dim,
      `Mode: ${LIVE ? "live probes" : "config only"} · ${STRICT ? "strict" : "default"} · .env loaded\n`,
    ),
  );

  const statusIcon = { ok: "✓", warn: "!", error: "✗", info: "○" };
  const statusColor = {
    ok: C.green,
    warn: C.yellow,
    error: C.red,
    info: C.gray,
  };

  for (const row of report) {
    const ic = statusIcon[row.level] || "?";
    const col = statusColor[row.level] || C.reset;
    console.log(paint(C.bold, `\n${row.label}`) + paint(C.dim, `  [${row.tier}] ${row.feature}`));
    console.log(
      paint(col, `  ${ic} ${row.overall}`) +
        (row.validateNote ? paint(C.dim, ` — ${row.validateNote}`) : "") +
        (row.live?.ok === true ? paint(C.green, ` · live: ${row.live.note}`) : "") +
        (row.live?.ok === false ? paint(C.red, ` · live: ${row.live.note}`) : ""),
    );

    if (!row.codePresent) {
      console.log(paint(C.red, `  ✗ code missing: ${row.missingFiles.join(", ")}`));
    }

    for (const ks of row.keyStates) {
      const kCol =
        ks.status === "ok" ? C.green : ks.status === "optional-empty" ? C.gray : C.yellow;
      console.log(
        paint(kCol, `    ${ks.key}`) +
          paint(C.dim, ` = ${ks.masked}`) +
          (ks.status !== "ok" ? paint(C.yellow, ` (${ks.status})`) : ""),
      );
    }

    if (row.edgeFunction) {
      const fnPath = `supabase/functions/${row.edgeFunction}/index.ts`;
      console.log(
        paint(C.dim, `    edge: ${row.edgeFunction}`) +
          (fileExists(fnPath) ? paint(C.green, " · fn present") : paint(C.red, " · fn MISSING")),
      );
    }

    if (row.fallback && row.level !== "ok") {
      console.log(paint(C.dim, `    fallback: ${row.fallback}`));
    }
  }

  console.log(paint(C.bold, "\n── Gaps ──\n"));

  const needsEnv = report.filter((r) => r.overall === "MISSING_ENV" || r.overall === "OFF");
  if (needsEnv.length) {
    console.log(paint(C.yellow, "Wired in code but not fully configured in .env:"));
    for (const r of needsEnv) {
      const keys = r.keyStates
        .filter((k) => k.status === "missing" || k.status === "placeholder")
        .map((k) => k.key);
      console.log(`  • ${r.label}${keys.length ? ` → add: ${keys.join(", ")}` : ""}`);
    }
  } else {
    console.log(paint(C.green, "  All integrated features have env keys set (or optional off)."));
  }

  if (undocumentedInExample.length) {
    console.log(paint(C.yellow, "\nIn code but missing from .env.example:"));
    for (const k of undocumentedInExample) console.log(`  • ${k}`);
  }

  if (inExampleNotRegistry.length) {
    console.log(paint(C.dim, "\nIn .env.example but not in integration registry (OK):"));
    for (const k of inExampleNotRegistry) console.log(`  • ${k}`);
  }

  console.log(paint(C.bold, "\n── Summary ──\n"));
  console.log(`  ${paint(errors ? C.red : C.green, `${errors} error(s)`)} · ${paint(warnings ? C.yellow : C.dim, `${warnings} warning(s)`)}`);
  console.log(paint(C.dim, "\n  npm run audit:apis -- --live     ping APIs (Supabase, GoldAPI, …)"));
  console.log(paint(C.dim, "  npm run audit:apis -- --strict   fail on optional missing env too\n"));

  process.exit(errors > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
