/**
 * Financial guidance coverage — registries, onboarding, empty states.
 */
import fs from "fs";
import path from "path";
import { ROOT, SRC, rel } from "../lib/audit-core.mjs";
import { FINANCIAL_CONCEPTS } from "../../src/guidance/registry/concepts.js";
import { ONBOARDING_EXPERIENCES } from "../../src/guidance/registry/onboardingCopy.js";
import { runCopyToneAudit } from "../lib/copy-tone-rules.mjs";

const JARGON_RE = /\b(EBITDA|amortization|liquidity ratio|NPV|IRR|capital expenditure)\b/i;
const UI_GUIDANCE = path.join(SRC, "ui", "guidance");

export function runGuidanceAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const guidanceDir = path.join(SRC, "guidance");
  if (!fs.existsSync(guidanceDir)) {
    errors.push({ message: "Missing src/guidance/ — centralized guidance required" });
  }

  if (!fs.existsSync(UI_GUIDANCE)) {
    errors.push({ message: "Missing src/ui/guidance/ UI primitives" });
  }

  const conceptIds = Object.keys(FINANCIAL_CONCEPTS);
  if (conceptIds.length < 8) {
    warnings.push({
      kind: "concept-coverage",
      message: `Only ${conceptIds.length} financial concepts registered — expand FINANCIAL_CONCEPTS`,
    });
  }

  for (const [id, c] of Object.entries(FINANCIAL_CONCEPTS)) {
    if (!c.title || !c.short || !c.why) {
      errors.push({ message: `Concept "${id}" missing title, short, or why` });
    }
    const blob = `${c.short} ${c.why} ${c.action || ""}`;
    if (JARGON_RE.test(blob)) {
      advisories.push({
        kind: "jargon",
        message: `Concept "${id}" may use heavy finance jargon`,
      });
    }
  }

  if (ONBOARDING_EXPERIENCES.length < 2) {
    warnings.push({
      kind: "onboarding",
      message: "Expected at least 2 onboarding experiences (salaried, household)",
    });
  }

  const explainPath = path.join(guidanceDir, "explainInsight.js");
  if (!fs.existsSync(explainPath)) {
    errors.push({ message: "Missing explainInsight.js for why-am-I-seeing-this" });
  }

  const homePage = path.join(SRC, "ui", "features", "pages", "HomePage.jsx");
  if (fs.existsSync(homePage)) {
    const code = fs.readFileSync(homePage, "utf8");
    const hasHomeGuidance =
      code.includes("FinancialPulseCard") ||
      code.includes("GuidanceBanner") ||
      code.includes("getDashboardFocus");
    if (!hasHomeGuidance) {
      advisories.push({
        kind: "dashboard-education",
        file: rel(homePage),
        message: "Home dashboard may lack attention guidance (Financial pulse or GuidanceBanner)",
      });
    }
    if (!code.includes("GuidedEmptyState")) {
      advisories.push({
        kind: "empty-state",
        file: rel(homePage),
        message: "Home may use generic empty states instead of GuidedEmptyState",
      });
    }
  }

  const onboard = path.join(SRC, "ui", "features", "pages", "OnboardingPage.jsx");
  if (fs.existsSync(onboard)) {
    const code = fs.readFileSync(onboard, "utf8");
    if (!code.includes("ONBOARDING_EXPERIENCES")) {
      warnings.push({
        kind: "onboarding-drift",
        file: rel(onboard),
        message: "OnboardingPage should use guidance registry ONBOARDING_EXPERIENCES",
      });
    }
  }

  const pulse = path.join(SRC, "ui", "features", "dashboard", "FinancialPulseCard.jsx");
  if (fs.existsSync(pulse)) {
    const code = fs.readFileSync(pulse, "utf8");
    if (!code.includes("WhyInsightPanel")) {
      advisories.push({
        kind: "insight-why",
        file: rel(pulse),
        message: "Financial pulse tips should expose WhyInsightPanel",
      });
    }
  }

  const tone = runCopyToneAudit();
  for (const item of tone.errorItems) {
    errors.push({
      kind: "informal-copy",
      file: item.file,
      line: item.line,
      message: `${item.rule}: ${item.message}`,
    });
  }
  for (const item of tone.warningItems) {
    advisories.push({
      kind: "informal-copy",
      file: item.file,
      line: item.line,
      message: `${item.rule}: ${item.message}`,
    });
  }

  return {
    id: "guidance",
    title: "Financial guidance system",
    errors,
    warnings,
    advisories,
  };
}
