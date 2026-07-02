/**
 * UX flow, user journey & interaction quality audit.
 * Role: UX Designer + Product Designer
 */
import fs from "fs";
import path from "path";
import { SRC, rel, walk } from "../lib/audit-core.mjs";

export function runUxFlowAudit() {
  const errors = [], warnings = [], advisories = [];
  const appFile = path.join(SRC, "App.jsx");

  if (fs.existsSync(appFile)) {
    const code = fs.readFileSync(appFile, "utf8");

    // Count redirect/dead routes
    const redirects = (code.match(/element=\{<Navigate\s+to=/g) || []).length;
    if (redirects > 10) {
      warnings.push({ kind: "dead-routes",
        message: `${redirects} redirect routes in App.jsx — dead user journeys from old navigation. Clean up or document.` });
    }
  }

  // Forms without feedback (no loading/success/error state visible)
  let formsWithoutFeedback = 0;
  for (const file of walk(path.join(SRC, "ui"), [], /\.jsx$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const hasForm = /onSubmit\s*=|handleSubmit/.test(code);
    const hasFeedback = /loading|success|error|saved|Saving|Submitting|isBusy|isLoading/.test(code);
    if (hasForm && !hasFeedback) {
      formsWithoutFeedback++;
      advisories.push({ kind: "form-no-feedback", file: r,
        message: "Form with onSubmit but no loading/success/error feedback — users can't tell if submission worked" });
    }
  }

  // Buttons with async actions but no loading state
  for (const file of walk(path.join(SRC, "ui"), [], /\.jsx$/)) {
    const r = rel(file);
    const code = fs.readFileSync(file, "utf8");
    const asyncBtnRe = /onClick\s*=\s*\{.*?async|onClick=\{handle\w+\}/;
    const hasLoading  = /disabled=\{.*?(?:loading|busy|saving)\}|isLoading/.test(code);
    if (asyncBtnRe.test(code) && !hasLoading && r.includes("features/")) {
      advisories.push({ kind: "async-btn-no-disabled", file: r,
        message: "Async action button may lack disabled+loading state — double-submit risk" });
    }
  }

  // Empty states coverage
  const featuresRoot = path.join(SRC, "ui/features");
  const featureDirs = fs.existsSync(featuresRoot)
    ? fs.readdirSync(featuresRoot).filter((name) => {
        try {
          return fs.statSync(path.join(featuresRoot, name)).isDirectory();
        } catch {
          return false;
        }
      })
    : [];
  let noEmptyState = 0;
  for (const dir of featureDirs) {
    const files = walk(path.join(SRC, "ui/features", dir), [], /\.jsx$/);
    const hasEmptyState = files.some(f => {
      const code = fs.readFileSync(f, "utf8");
      return /EmptyState|empty-state|no.*item|length.*===\s*0|\.length\s*<\s*1/.test(code);
    });
    if (!hasEmptyState && files.length > 0) {
      noEmptyState++;
      advisories.push({ kind: "feature-no-empty-state",
        message: `Feature "${dir}" has no empty state UI — first-time users see broken/blank screen` });
    }
  }

  // Back navigation coverage
  let pagesWithoutBack = 0;
  for (const file of walk(path.join(SRC, "ui/features"), [], /\.jsx$/)) {
    const r = rel(file);
    if (!r.includes("BreakdownPage") && !r.includes("DetailPage") && !r.includes("SubPage")) continue;
    const code = fs.readFileSync(file, "utf8");
    if (!/navigate\(-1\)|navigate\("\/|useNavigate|← Back|back/.test(code)) {
      pagesWithoutBack++;
      advisories.push({ kind: "subpage-no-back", file: r,
        message: "Sub-page or detail page with no back navigation — users get stranded" });
    }
  }

  // Onboarding flow exists
  const onboardFile = path.join(SRC, "ui/features/pages/OnboardingPage.jsx");
  if (!fs.existsSync(onboardFile)) {
    errors.push({ kind: "no-onboarding", message: "No OnboardingPage.jsx — new users have no guided first-run experience" });
  }

  return { id: "ux-flow", title: "UX flow, user journey & interaction quality", errors, warnings, advisories };
}
