/**
 * React context & state management audit.
 * Role: React State Architect
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

export function runContextAudit() {
  const errors = [], warnings = [], advisories = [];

  // Count context consumers
  const contextConsumers = {};
  const CONTEXTS = ["usePerovo", "useNetWorth", "useAuth", "useTranslation"];
  for (const ctx of CONTEXTS) contextConsumers[ctx] = [];

  for (const file of walk(SRC, [], /\.(jsx|js)$/)) {
    const r = rel(file);
    if (r.includes("__tests__") || r.includes("Context.jsx")) continue;
    const code = fs.readFileSync(file, "utf8");
    for (const ctx of CONTEXTS) {
      if (new RegExp(`\\b${ctx}\\s*\\(`).test(code)) {
        contextConsumers[ctx].push(r);
      }
    }
  }

  const perovoCount = contextConsumers["usePerovo"].length;
  if (perovoCount > 150) {
    errors.push({ kind: "monolithic-context",
      message: `usePerovo consumed by ${perovoCount} components — single context subscribed everywhere causes mass rerenders on any state change`,
      detail: "Split into: CommitmentsContext, GoalsContext, SettingsContext, SpendsContext, LendingsContext" });
  } else if (perovoCount > 80) {
    warnings.push({ kind: "wide-context",
      message: `usePerovo consumed by ${perovoCount} components — consider splitting by domain to reduce rerender surface` });
  }

  // Detect ...spread in context value
  for (const file of walk(path.join(SRC, "context"), [], /\.(jsx|js)$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");

    if (/value=\{[\s\S]{0,100}\.\.\.\w/.test(code)) {
      warnings.push({ kind: "context-spread",
        file: r, message: "Context value uses spread operator (...) — prevents React from memoizing individual keys, all consumers rerender on any key change" });
    }

    // Context without useMemo on value
    if (/\.Provider\s+value=\{(?!.*useMemo)/.test(code)) {
      warnings.push({ kind: "context-no-memo", file: r,
        message: "Context value not memoized — new object reference on every render rerenders all consumers" });
    }
  }

  // Hooks without dependency arrays
  for (const file of walk(path.join(SRC, "ui"), [], /\.jsx$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const useEffectNoArr = [...code.matchAll(/useEffect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>/g)].length;
    const useEffectTotal = (code.match(/useEffect\s*\(/g) || []).length;
    if (useEffectNoArr > 0 && useEffectTotal > 0) {
      const ratio = useEffectNoArr / useEffectTotal;
      if (ratio > 0.5) {
        advisories.push({ kind: "useeffect-no-deps", file: r,
          message: `${useEffectNoArr}/${useEffectTotal} useEffect(s) may be missing dependency array — causes re-run on every render` });
      }
    }
  }

  // useCallback missing on functions passed as props
  for (const file of walk(path.join(SRC, "ui"), [], /\.jsx$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const inlineFnProps = (code.match(/\bonChange=\{(?!\s*(?:useCallback|\([^)]*\)\s*=>.*[\n].*return|[a-zA-Z]\w*\b))/) || []).length;
    if (inlineFnProps > 3) {
      advisories.push({ kind: "inline-fn-prop", file: r,
        message: "Multiple inline function props — each creates a new reference on render, preventing child memoization" });
    }
  }

  return { id: "context", title: "React context & state management", errors, warnings, advisories };
}
