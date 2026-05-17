/**
 * Generates CommitTrack-Complete-Documentation.pdf in docs/
 * Run: npm run docs:pdf
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "docs");
const outFile = path.join(outDir, "CommitTrack-Complete-Documentation-Full.pdf");
const tmpFile = path.join(outDir, ".CommitTrack-Complete-Documentation.tmp.pdf");

const COLORS = {
  brand: "#4f46e5",
  heading: "#1e1b4b",
  sub: "#4338ca",
  body: "#1f2937",
  muted: "#6b7280",
};

class DocWriter {
  constructor(doc) {
    this.doc = doc;
    this.y = 50;
    this.pageNum = 1;
    this.toc = [];
    this.tocBookmark = null;
  }

  ensureSpace(need = 60) {
    if (this.y + need > this.doc.page.height - 55) {
      this.pageBreak();
    }
  }

  pageBreak() {
    this.doc.addPage();
    this.pageNum += 1;
    this.y = 50;
    this.footer();
  }

  footer() {
    const { doc } = this;
    const prevY = this.y;
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(`CommitTrack Documentation · Page ${this.pageNum}`, 50, doc.page.height - 35, {
        align: "center",
        width: doc.page.width - 100,
      });
    this.y = prevY;
  }

  h1(text, addToc = true) {
    this.ensureSpace(50);
    if (addToc) this.toc.push({ level: 1, title: text, page: this.pageNum });
    this.doc.font("Helvetica-Bold").fontSize(18).fillColor(COLORS.brand).text(text, 50, this.y);
    this.y += 28;
  }

  h2(text, addToc = true) {
    this.ensureSpace(40);
    if (addToc) this.toc.push({ level: 2, title: text, page: this.pageNum });
    this.doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.heading).text(text, 50, this.y);
    this.y += 20;
  }

  h3(text) {
    this.ensureSpace(32);
    this.doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.sub).text(text, 50, this.y);
    this.y += 16;
  }

  p(text, opts = {}) {
    this.doc.font("Helvetica").fontSize(10).fillColor(COLORS.body);
    const w = opts.width || 495;
    const h = this.doc.heightOfString(text, { width: w, lineGap: 3 });
    this.ensureSpace(h + 12);
    this.doc.text(text, opts.indent ? 50 + opts.indent : 50, this.y, { width: w, lineGap: 3, align: opts.align });
    this.y += h + (opts.gap ?? 10);
  }

  bullets(items, indent = 0) {
    for (const item of items) {
      const prefix = "• ";
      const w = 490 - indent;
      const h = this.doc.heightOfString(prefix + item, { width: w, lineGap: 2 });
      this.ensureSpace(h + 6);
      this.doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.body).text(prefix + item, 55 + indent, this.y, {
        width: w,
        lineGap: 2,
      });
      this.y += h + 6;
    }
    this.y += 4;
  }

  table(headers, rows) {
    const colW = (495 - 10) / headers.length;
    this.ensureSpace(24 + rows.length * 14);
    let x = 50;
    this.doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.heading);
    headers.forEach((h) => {
      this.doc.text(h, x, this.y, { width: colW - 4 });
      x += colW;
    });
    this.y += 14;
    this.doc.font("Helvetica").fontSize(8).fillColor(COLORS.body);
    for (const row of rows) {
      x = 50;
      this.ensureSpace(14);
      row.forEach((cell) => {
        this.doc.text(String(cell).slice(0, 80), x, this.y, { width: colW - 4 });
        x += colW;
      });
      this.y += 12;
    }
    this.y += 8;
  }

  codeBlock(lines) {
    const text = Array.isArray(lines) ? lines.join("\n") : lines;
    const h = this.doc.heightOfString(text, { width: 470, lineGap: 1 });
    this.ensureSpace(h + 16);
    this.doc
      .rect(50, this.y - 2, 495, h + 10)
      .fill("#f3f4f6");
    this.doc.font("Courier").fontSize(7.5).fillColor("#111827").text(text, 58, this.y + 4, {
      width: 470,
      lineGap: 1,
    });
    this.y += h + 18;
  }
}

const CONTENT = [
  {
    part: "PART I — OVERVIEW",
    sections: [
      {
        title: "1. What is CommitTrack?",
        body: [
          "CommitTrack is a local-first Progressive Web App (PWA) for tracking personal financial commitments: recurring bills, EMIs, subscriptions, insurance premiums, money lent to or borrowed from people, savings goals, and month-by-month financial pressure.",
          "All data is stored in the browser's localStorage on the user's device. There is no backend server, user authentication, or cloud sync in the current implementation. The app is built with React 19, Vite 8, React Router 7, Tailwind CSS 3, date-fns, and Recharts.",
          "Primary audience: salaried individuals, freelancers, families, business owners, and students (student mode hides lending features). The app emphasizes privacy (data never leaves the device unless the user exports JSON/CSV), affordability awareness, and actionable insights rather than bank integration.",
        ],
      },
      {
        title: "2. High-level architecture",
        bullets: [
          "Entry: index.html → main.jsx → ErrorBoundary → App.jsx",
          "App.jsx wraps CommitTrackProvider, BrowserRouter (with GitHub Pages basename), ThemeSync, routes",
          "Onboarding gate: settings.onboardingComplete must be true to see MainShell",
          "MainShell: Navbar + NotificationSync + lazy-loaded page routes inside Suspense",
          "State: CommitTrackContext holds commitments, lendings, settings, monthlySnapshots, goals",
          "Persistence: every mutation writes to localStorage immediately",
          "Intelligence: useCommitIntel hook aggregates 15+ engine modules for Home dashboard",
          "Engines: pure JavaScript functions (no React) for calculations and insights",
          "Utils: date handling, payments, migration, lending schedules, bill lifecycle",
        ],
      },
      {
        title: "3. Technology stack",
        table: {
          headers: ["Layer", "Technology", "Purpose"],
          rows: [
            ["UI", "React 19", "Components, hooks, context"],
            ["Routing", "React Router 7", "SPA routes, lazy loading"],
            ["Build", "Vite 8", "Dev server, production bundle"],
            ["Styling", "Tailwind CSS 3", "Utility classes, dark mode class strategy"],
            ["Dates", "date-fns 4", "Parsing, month arithmetic, formatting"],
            ["Charts", "Recharts 3", "Analytics bar/line/pie charts"],
            ["PWA", "vite-plugin-pwa", "Service worker, manifest, precache"],
            ["Tests", "Vitest 3", "Unit tests for engines and utils"],
            ["Deploy", "gh-pages", "Static hosting from dist/"],
            ["PDF", "pdfkit", "This documentation generator"],
          ],
        },
      },
      {
        title: "4. Repository layout",
        bullets: [
          "src/pages/ — Full-screen route components (9 pages)",
          "src/components/ — Reusable UI including dashboard/, lending/ subfolders",
          "src/context/ — CommitTrackContext.jsx global state",
          "src/engines/ — Business logic calculators (21 modules)",
          "src/utils/ — Helpers, migration, repayment submodule",
          "src/constants/ — Categories, nav, modes, copy, symbols",
          "src/hooks/ — useCommitIntel, usePwaInstall, useProfileScope",
          "src/services/notifications/ — Browser notification bridge",
          "public/ — PWA icons, favicon",
          "scripts/ — Build helpers, PDF generators",
        ],
      },
    ],
  },
];

// Append massive content programmatically
function buildFullContent() {
  const routes = {
    title: "5. Application routes",
    subsections: [
      {
        h: "5.1 Route table",
        table: {
          headers: ["Path", "Component", "Access"],
          rows: [
            ["/", "Home", "Main shell, dashboard"],
            ["/commitments", "Commitments", "Bill list, pay, edit"],
            ["/add", "Add", "New bill form (not in nav)"],
            ["/lending", "Lending", "Money page; ModeRoute blocks students"],
            ["/analytics", "Analytics", "Charts; opened from Home month card"],
            ["/tools", "Tools", "Redirects to /#dashboard-tools on Home"],
            ["/profile", "Profile", "Settings, export, stats"],
            ["/onboarding", "Onboarding", "First-run only shell"],
            ["/lend/offer?d=...", "LendingOfferReview", "Outside main shell; share link"],
          ],
        },
      },
      {
        h: "5.2 Home page (Dashboard)",
        bullets: [
          "PageHeaderWithNotifications: bell opens NotificationPanel (portal, fixed position)",
          "InstallAppBanner: PWA install prompt",
          "HomeOverviewCard: gradient month card; tap navigates to /analytics",
          "Financial stability card: pressure score, health, yearly burden from useCommitIntel",
          "Goals preview: up to 3 goals with progress bars; Manage scrolls to #dashboard-tools",
          "Payoff priority, Insights, Forecast, Subscriptions cards when data exists",
          "Upcoming payments: top 3 pending active bills",
          "Overdue section: red-highlighted overdue bills",
          "DashboardTools: 4 calculator widgets at bottom (insurance, EMI, payoff, goals)",
          "ToolsDiscoveryToast: floating nudge on Home and Analytics; hides while scrolling",
        ],
      },
      {
        h: "5.3 Commitments (Bills)",
        bullets: [
          "Tabs/filters: All, Due now, Up next, Overdue, Paid history",
          "Sort: priority then due date",
          "Each row: category icon, name, Started/Ends/Due dates, amount, status badge",
          "Actions: tap row → BillDetailModal; Pay opens payment modal; Edit → CommitmentEditModal",
          "Add bill: navigates to /add",
          "Payment recording reduces remainingAmount; full pay on recurring spawns next cycle row",
        ],
      },
      {
        h: "5.4 Add bill",
        bullets: [
          "Category select drives insurance fields, interest rate, priority inference",
          "Start date (when bill began), End date (optional), Next payment due (computed from repeat)",
          "billDates.js: due date is next cycle ≥ today, not copy of start; end uses start MD + current year",
          "Repeat: none, monthly, bimonthly, quarterly, every4months, yearly",
          "Affordability card (mode-dependent): evaluateNewCommitmentAffordability",
          "Prior spend estimate for bills starting before current year",
        ],
      },
      {
        h: "5.5 Lending (Money)",
        bullets: [
          "Sections: Money you owe (borrowed) vs Money you lent",
          "Trust table per person from lendingTrustByPerson",
          "Manual add/edit modal with LendingFormFields + repayment schedule",
          "LendingRequestModal: borrower flow → agreement → share link",
          "LendingDetailModal: schedule, proofs, simulate UPI payment, HTML export",
          "Delete guarded by canDeleteLending when agreementLocked",
        ],
      },
      {
        h: "5.6 Analytics",
        bullets: [
          "Month at a glance: due, paid, left, free cash",
          "Affordability strip: income, burden, free after dues",
          "Biggest category pie data, highest recurring, 4-week due heatmap",
          "Lending repayment stats when lendings exist",
          "AnalyticsChartPanel: forecast, payments, categories + optional advanced charts",
        ],
      },
      {
        h: "5.7 Profile",
        bullets: [
          "ProfileAvatar: upload image or mode-based cartoon",
          "Collapsible Account settings: theme, income, user mode, active profile label",
          "Stats: streak, control score, payment count, recent payments",
          "Export JSON (all profiles) and CSV (scoped)",
          "Browser notification permission test",
          "No Analytics/Tools tiles (moved to Home)",
        ],
      },
      {
        h: "5.8 Onboarding",
        bullets: [
          "Select user mode (salaried, business, freelancer, family, student, power)",
          "Display name, monthly income, business type if applicable",
          "Sets onboardingComplete and persists settings",
        ],
      },
    ],
  };

  const storage = {
    title: "6. Data storage and schema (v8)",
    subsections: [
      {
        h: "6.1 localStorage keys",
        table: {
          headers: ["Key", "Type", "Description"],
          rows: [
            ["commitments", "JSON array", "All bill records"],
            ["lendings", "JSON array", "All lending records"],
            ["committrack_settings", "JSON object", "User preferences"],
            ["committrack_monthly_snapshots", "JSON array", "Up to 48 monthly snapshots"],
            ["committrack_goals", "JSON array", "Savings/debt goals"],
            ["committrack_schema_version", "number", "Current: 8"],
            ["committrack_tools_nudge_dismissed", "flag", "Calculator toast dismissed"],
            ["committrack_pwa_install_dismissed", "flag", "Install banner dismissed"],
            ["committrack_last_notif_digest", "date", "Daily notification digest"],
          ],
        },
      },
      {
        h: "6.2 Commitment (bill) fields",
        bullets: [
          "id, name, amount, remainingAmount, category, startDate, endDate, dueDate",
          "repeatType, priority (critical|medium|low), status, payments[{amount,date}]",
          "notes, profileId, annualInterestRate, trialEnd, priorSpend",
          "Insurance: insurancePolicyId, insuredPersonName, insuranceCompany, insuranceSumAssured, insuranceTermYears, insurancePremiumFrequency, insuranceMaturityBenefit",
          "createdAt, updatedAt timestamps",
        ],
      },
      {
        h: "6.3 Lending fields",
        bullets: [
          "id, personName, type (lent|borrowed), totalAmount, remainingAmount, dueDate",
          "payments with principalPortion, interestPortion, paymentType, onTime",
          "Agreement: agreementText, agreementLocked, offerId, borrowerSignName, lenderSignName, timestamps",
          "Financials from enrichLendingFinancials: interestRate, interestType, repaymentFrequency, repaymentSchedule[]",
          "proofs[], disputeStatus, relationshipTag, trustScoreSnapshot",
        ],
      },
      {
        h: "6.4 Settings fields",
        bullets: [
          "monthlyIncome, displayName, userMode, onboardingComplete",
          "activeProfileId (default|family|business labels only)",
          "colorScheme (light|dark|system), avatarSource, profileImageDataUrl",
          "readNotificationIds[], savedTowardGoals (legacy, migrated to goals)",
        ],
      },
      {
        h: "6.5 Goal types",
        bullets: [
          "reduce_open_debt: targetReduction amount",
          "income_ratio_cap: targetRatio (e.g. 0.45 = 45% of income to bills)",
          "save_amount: targetAmount + savedAmount progress",
        ],
      },
      {
        h: "6.6 Monthly snapshot fields",
        bullets: [
          "month (yyyy-MM), openRemainingSum, paidMonthSum, overdueSum, freeMoney",
          "pressureScore, commitmentRatio, monthlyBurden, totalCommitmentsCount, recordedAt",
          "Auto-appended once per calendar month from active profile commitments",
        ],
      },
    ],
  };

  const contextApi = {
    title: "7. CommitTrackContext API",
    subsections: [
      {
        h: "7.1 Exposed data (profile-scoped unless noted)",
        bullets: [
          "commitments, sortedCommitments — filtered by activeProfileId",
          "lendings, goals — filtered",
          "allCommitments, allLendings, allGoals — unfiltered",
          "settings, monthlySnapshots, todayStr, activeProfileId",
        ],
      },
      {
        h: "7.2 Status helpers",
        bullets: [
          "getEffectiveStatus(commitment) — paid|upnext|pending|overdue based on dates and remaining",
          "getEffectiveLendingStatus(lending) — pending|overdue|complete",
        ],
      },
      {
        h: "7.3 Mutations",
        bullets: [
          "addCommitment, updateCommitment, deleteCommitment",
          "addCommitmentPayment — applies payment; advanceRecurringCommitment on full pay",
          "addLending, updateLending, deleteLending (with agreement lock rules)",
          "addLendingPayment — structured principal/interest split",
          "updateSettings, addGoal, updateGoal, deleteGoal, logSavingsToGoal",
          "markNotificationRead, markAllNotificationsRead",
        ],
      },
    ],
  };

  const billLifecycle = {
    title: "8. Bill lifecycle and status engine",
    subsections: [
      {
        h: "8.1 getEffectiveStatus (commitmentStatus.js)",
        bullets: [
          "If endDate passed → paid",
          "If remainingAmount <= 0 and non-recurring → paid",
          "If due month > current month → upnext",
          "If dueDate < today and remaining > 0 → overdue",
          "Else → pending",
        ],
      },
      {
        h: "8.2 Recurring advancement (commitmentRecurring.js)",
        bullets: [
          "advanceRecurringCommitment: when remaining hits 0 on repeating bill",
          "Creates paid row + new pending row with dueDate advanced by repeat interval",
          "repeatType none: single paid row only",
        ],
      },
      {
        h: "8.3 isBillDueInMonth (repeatTypes.js)",
        bullets: [
          "Determines if obligation exists in calendar month for analytics/forecast",
          "Yearly: matches month-day of due/anchor",
          "Other repeats: month offset divisible by interval",
        ],
      },
      {
        h: "8.4 billDates.js",
        bullets: [
          "defaultEndDateFromStart: same MM-DD as start, current year (≥ start)",
          "defaultDueDateFromStart: next due on/after today from anchor + repeat",
          "applyBillStartDateChange / applyBillRepeatChange for Add/Edit forms",
        ],
      },
      {
        h: "8.5 Payments (commitmentPayments.js)",
        bullets: [
          "applyPaymentToCommitment: adds payment, reduces remaining, may update status",
        ],
      },
    ],
  };

  const engines = {
    title: "9. Calculation engines (complete reference)",
    subsections: [
      {
        h: "9.1 affordability.js",
        bullets: [
          "evaluateAffordability(income, burden) → tier, label, committedPercent, freeMoney",
          "evaluateNewCommitmentAffordability — simulates adding draft bill",
          "affordabilityBadgeClass(tier) — Tailwind classes for UI badge",
        ],
      },
      {
        h: "9.2 burden.js",
        bullets: [
          "monthlyBurdenForCommitment — amount per month for one bill",
          "totalMonthlyBurden — sum across open commitments",
          "monthlyBurdenForDraft — for affordability preview",
        ],
      },
      {
        h: "9.3 pressureScore.js",
        bullets: [
          "computeCanonicalPressureScore — 0-100 from burden, overdue, snapshots",
          "freeMoneyAfterBurden — income minus monthly burden, open remaining",
          "pressureScoreLabel, pressureScoreBadgeClass",
        ],
      },
      {
        h: "9.4 pressureAdvanced.js",
        bullets: [
          "commitmentToIncomeRatio, monthlyPressureScore, pressureSeverity",
          "yearlyBurdenEstimate — annualized burden projection",
        ],
      },
      {
        h: "9.5 financialHealth.js",
        bullets: [
          "computeFinancialHealthScore — combines burden, overdue count, open debt",
          "healthLevelBadgeClass",
        ],
      },
      {
        h: "9.6 intelligence.js",
        bullets: [
          "generateCommitmentInsights — core dashboard insight cards with tone (critical/warning/positive)",
        ],
      },
      {
        h: "9.7 insightsExtended.js",
        bullets: [
          "overlappingDueDatesInsight, forecastCrunchInsight",
          "subscriptionYearlyCostInsight, emiBurdenPercentInsight",
          "mergeExtendedInsights — dedupe and cap count",
        ],
      },
      {
        h: "9.8 forecast.js & forecastSeries.js",
        bullets: [
          "forecastInsights — short text forecasts for dashboard",
          "buildCashflowForecastSeries — 12-month due vs free cash bars",
          "scheduledGrossInMonth, amountDueInMonth",
        ],
      },
      {
        h: "9.9 analyticsSeries.js",
        bullets: [
          "snapshotsToPressureTrend, debtReductionFromSnapshots",
          "recurringGrowthSeries, freeCashflowTrend",
          "buildDueHeatmap — 4-week buckets",
          "lendingPrincipalInterestTotals, lendingCompletionStats",
          "categoryOpenTrend (exported, limited UI use)",
        ],
      },
      {
        h: "9.10 payoffOptimizer.js",
        bullets: [
          "debtsFromCommitments, snowballOrder, avalancheOrder",
          "estimatePayoffTimeline, comparePayoffStrategies",
          "Recommendation with reason for DashboardTools payoff modal",
        ],
      },
      {
        h: "9.11 payoffPriority.js",
        bullets: [
          "effectiveAnnualRate by category default",
          "payoffPriorityScore, rankPayoffOrder, topPayoffRecommendation",
        ],
      },
      {
        h: "9.12 prepayment.js",
        bullets: [
          "simulatePrepayment — months saved, interest saved",
          "computeEmiFromPrincipal — standard EMI formula",
        ],
      },
      {
        h: "9.13 insuranceCalculator.js",
        bullets: [
          "simulateInsurancePolicy — premiums, maturity, IRR-style metrics",
          "analyzeInsuranceWorth — inflation-adjusted verdict",
          "insuranceParamsFromBill",
        ],
      },
      {
        h: "9.14 goalsProgress.js",
        bullets: [
          "computeGoalProgress — 0-1 fraction by goal type",
          "goalTypeLabel",
        ],
      },
      {
        h: "9.15 lendingTrust.js",
        bullets: [
          "lendingTrustByPerson — aggregate on-time/delayed per person",
          "trustScoreForLendingEntry, trustBadgeClass, trustSummaryLine",
        ],
      },
      {
        h: "9.16 lendingAgreement.js",
        bullets: [
          "buildAgreementText — plain-language loan terms",
          "encodeOfferPayload / decodeOfferPayload — base64 share link",
          "buildOfferShareUrl — /lend/offer?d=",
          "borrowerTrustSnapshot, canDeleteLending, trustScoreLabel",
        ],
      },
      {
        h: "9.17 reminders.js & notifications.js",
        bullets: [
          "buildSubscriptionEndReminders, buildCommitmentReminders, buildLendingReminders",
          "buildNotificationFeed — merges reminders + insights for bell",
          "unreadCount",
        ],
      },
      {
        h: "9.18 snapshots.js & subscriptionLeak.js",
        bullets: [
          "buildMonthlySnapshot — captures month KPIs",
          "subscriptionLeakReport — low-priority recurring spend signals",
        ],
      },
    ],
  };

  const lendingFlow = {
    title: "10. Lending flows (step-by-step)",
    subsections: [
      {
        h: "10.1 Manual entry",
        bullets: [
          "User opens Money → Add → fills LendingFormFields",
          "buildLendingRecord + enrichLendingFinancials generates repaymentSchedule",
          "addLending persists normalized row",
        ],
      },
      {
        h: "10.2 Borrower request flow",
        bullets: [
          "LendingRequestModal step 1: names, amount, rate, due, collateral, purpose",
          "Step 2: agreement text, borrower signature, accept checkbox",
          "Creates type=borrowed with agreementLocked, offerId",
          "buildOfferShareUrl copies link for lender",
        ],
      },
      {
        h: "10.3 Lender offer acceptance",
        bullets: [
          "LendingOfferReview at /lend/offer?d=payload",
          "decodeOfferPayload shows terms + borrower trust score",
          "Lender signs → addLending type=lent with mirrored agreement fields",
        ],
      },
      {
        h: "10.4 Repayment submodule (utils/repayment/)",
        bullets: [
          "schedule.js — generate installment rows by frequency",
          "calculations.js — EMI, simple/compound interest",
          "payments.js — applyPaymentToLending with allocation",
          "index.js re-exports",
        ],
      },
    ],
  };

  const components = {
    title: "11. UI components inventory",
    subsections: [
      {
        h: "11.1 Core",
        bullets: [
          "Card — surface container; ui-card class when enhanced theme",
          "Modal — titled dialog with footer slot",
          "Navbar — 4-tab mobile grid, desktop top bar",
          "PageHeaderWithNotifications — title + bell",
          "NotificationPanel — portal overlay reminder list",
          "ThemeSync — applies dark class from settings.colorScheme",
          "ModeRoute — redirects if path not allowed for user mode",
          "ErrorBoundary — catches render errors",
        ],
      },
      {
        h: "11.2 Bills",
        bullets: [
          "BillDetailModal — spend summary, payment history, insurance hint",
          "CommitmentEditModal — full edit with billDates helpers",
          "CategoryChip, PriorityBadge, InsuranceFields",
        ],
      },
      {
        h: "11.3 Dashboard",
        bullets: [
          "HomeOverviewCard, DashboardTools, ToolsDiscoveryPrompt",
          "ToolWidget, InsuranceCalculatorModal",
          "RoleDashboardPanel (defined, optional future use)",
        ],
      },
      {
        h: "11.4 Lending",
        bullets: [
          "LendingFormFields, LendingRequestModal, LendingDetailModal",
          "LendingDetailDashboard — stats, timeline, schedule table",
        ],
      },
      {
        h: "11.5 Other",
        bullets: [
          "AnalyticsChartPanel — Recharts switcher",
          "ProfileAvatar, CollapsibleSection, InstallAppBanner",
        ],
      },
    ],
  };

  const hooksServices = {
    title: "12. Hooks and services",
    subsections: [
      {
        h: "12.1 useCommitIntel",
        bullets: [
          "Aggregates: stability, health, insights, forecast, subscriptionLeak",
          "payoffRec, notifications, notificationUnread, yearlyBurden, burdenRatio",
          "Used by Home, NotificationPanel, NotificationSync",
        ],
      },
      {
        h: "12.2 usePwaInstall",
        bullets: [
          "Captures beforeinstallprompt, exposes install(), dismiss, platform hints",
        ],
      },
      {
        h: "12.3 Notification services",
        bullets: [
          "browserNotifications.js — permission, showNotification",
          "scheduler.js — daily digest max 3 items",
          "reminderBridge.js — connects intel reminders to browser API",
          "NotificationSync — runs scheduler on interval when app open",
        ],
      },
    ],
  };

  const categories = {
    title: "13. Categories, priority, and user modes",
    subsections: [
      {
        h: "13.1 Bill categories",
        bullets: [
          "EMI, Credit Card, Subscription, Insurance, SIP, Rent, Loan, Utility, Other",
          "Insurance shows InsuranceFields; EMI/Loan show interest %",
          "Subscription supports trialEnd and end-date cancel reminders",
        ],
      },
      {
        h: "13.2 Priority",
        bullets: [
          "critical, medium, low — inferred from category except Other (user picks)",
        ],
      },
      {
        h: "13.3 User modes",
        table: {
          headers: ["Mode", "Nav tabs", "Lending", "Affordability on Add"],
          rows: [
            ["salaried", "4", "Yes", "Yes"],
            ["business", "4", "Yes", "No"],
            ["freelancer", "4", "Yes", "Yes"],
            ["family", "4", "Yes", "Yes"],
            ["student", "3 (no Money)", "No", "Yes"],
            ["power", "4", "Yes", "Yes"],
          ],
        },
      },
    ],
  };

  const pwa = {
    title: "14. PWA and deployment",
    subsections: [
      {
        h: "14.1 PWA",
        bullets: [
          "vite-plugin-pwa: autoUpdate service worker",
          "Precaches JS, CSS, HTML, icons",
          "manifest: standalone, portrait, theme color",
          "InstallAppBanner + usePwaInstall",
        ],
      },
      {
        h: "14.2 Deployment",
        bullets: [
          "npm run build → dist/",
          "gh-pages deploy; basePath /PROJECTapp/ for GitHub Pages",
          "copy-404.mjs duplicates index.html for SPA routing",
        ],
      },
      {
        h: "14.3 UI theme (revertible)",
        bullets: [
          "src/constants/uiTheme.js — UI_THEME_ID: enhanced | legacy",
          "enhanced loads ui-enhanced.css: Plus Jakarta Sans, Outfit, gradients",
          "Set legacy to revert fonts/colors without code rollback",
        ],
      },
    ],
  };

  const tests = {
    title: "15. Automated tests",
    subsections: [
      {
        h: "15.1 Test files (15 tests)",
        table: {
          headers: ["File", "What it tests"],
          rows: [
            ["affordability.test.js", "Income ratio tiers and free money"],
            ["payoffOptimizer.test.js", "Snowball vs avalanche ordering"],
            ["commitmentStatus.test.js", "Overdue and paid status"],
            ["commitmentRecurring.test.js", "Monthly cycle advancement"],
            ["repayment.test.js", "EMI schedule and payments"],
            ["billDates.test.js", "Due/end date defaults from start"],
          ],
        },
      },
    ],
  };

  const limitations = {
    title: "16. Implementation status, gaps, and roadmap",
    subsections: [
      {
        h: "16.1 Fully implemented",
        bullets: [
          "Full bill CRUD with recurring cycles and payments",
          "Lending with schedules, trust, agreements, share links",
          "Home dashboard intelligence and calculator tools",
          "Analytics with 6 chart views",
          "Profile export, theme, avatars, onboarding",
          "PWA install shell and in-app notifications",
        ],
      },
      {
        h: "16.2 Partial / basic",
        bullets: [
          "Profiles: filter labels only, no create/rename UI",
          "Snapshots: global per month, not per profile",
          "Notifications: no push when app closed; daily digest only",
          "Goals: no edit modal, only add/delete/log savings",
          "No JSON import (export only)",
          "Mutual cancel fields exist but limited UI",
        ],
      },
      {
        h: "16.3 Not implemented",
        bullets: [
          "Backend, authentication, cloud sync, real UPI",
          "Bank feed / SMS parsing",
          "E2E tests, CI pipeline in repo",
          "CommitTrack Plus (placeholder)",
          "Legal e-sign compliance beyond local typed names",
        ],
      },
      {
        h: "16.4 Suggested next steps",
        bullets: [
          "JSON import paired with export",
          "Per-profile monthly snapshots",
          "Background due reminders",
          "Include lending in 12-month cashflow forecast",
          "Goal edit UI and onboarding re-entry from Profile",
        ],
      },
    ],
  };

  const utilsRef = {
    title: "17. Utilities module reference",
    subsections: [
      {
        h: "17.1 dates.js",
        bullets: ["todayYmd() — local calendar date YYYY-MM-DD", "compareYmd(a,b) — string compare for dates"],
      },
      {
        h: "17.2 migrateStorage.js",
        bullets: [
          "CURRENT_SCHEMA_VERSION = 8",
          "normalizeCommitment, normalizeLending, normalizeGoal",
          "loadInitialAppState — reads all keys, migrates legacy savedTowardGoals",
          "saveMonthlySnapshotsToStorage, saveGoalsToStorage",
        ],
      },
      {
        h: "17.3 commitmentStatus.js",
        bullets: [
          "getEffectiveStatus(c, todayStr)",
          "normalizeCommitmentStatusForSave — persists computed status",
        ],
      },
      {
        h: "17.4 commitmentPayments.js & commitmentSpendSummary.js",
        bullets: [
          "applyPaymentToCommitment, totalPaidOnPayments",
          "summarizeCommitmentSpend — spent, future, total for BillDetailModal",
        ],
      },
      {
        h: "17.5 billLifecycle.js & billDisplayName.js",
        bullets: ["estimatePriorSpend, BILL_STATUS_UI, isActiveBill", "display name helpers for insurance bills"],
      },
      {
        h: "17.6 lendingRecord.js & lendingFinancials.js",
        bullets: [
          "buildLendingRecord — canonical new lending object",
          "enrichLendingFinancials — schedule, principal, interest breakdown",
        ],
      },
      {
        h: "17.7 lendingStatus.js & lendingPayments.js & lendingTimeline.js",
        bullets: [
          "getEffectiveLendingStatus, applyPaymentToLending",
          "buildLendingTimeline events for detail dashboard",
        ],
      },
      {
        h: "17.8 monthPaymentSummary.js",
        bullets: ["computeCurrentMonthSummary — due/paid/left/free for Analytics month card"],
      },
      {
        h: "17.9 profileScope.js & profileStats.js",
        bullets: [
          "filterByProfile(list, profileId)",
          "computePaymentMonthStreak, computeControlScore, outstandingLent",
        ],
      },
      {
        h: "17.10 theme.js & applyUiTheme.js & basePath.js",
        bullets: [
          "bootstrapThemeFromStorage — applies dark class before paint",
          "routerBasename for GitHub Pages /PROJECTapp/",
        ],
      },
      {
        h: "17.11 agreementExport.js",
        bullets: ["exportAgreementHtml — downloadable HTML summary of lending agreement"],
      },
    ],
  };

  const constantsRef = {
    title: "18. Constants and copy",
    subsections: [
      {
        h: "18.1 Key constant files",
        bullets: [
          "categories.js — CATEGORIES, categoryShowsInsuranceFields, categoryShowsInterestRate",
          "repeatTypes.js — REPEAT_OPTIONS, isBillDueInMonth, normalizeRepeatType",
          "priority.js — inferPriorityFromCategory, OTHER_PRIORITY_OPTIONS",
          "insurance.js — buildInsuranceBillName, emptyInsuranceFields, repeatTypeToPremiumFrequency",
          "nav.js — NAV_ITEMS (Home, Bills, Money, Profile)",
          "userModes.js — USER_MODES, navItemsForMode",
          "plainLanguage.js — CHART_VIEWS, TOOLS_PLAIN, legal disclaimer",
          "symbols.js — formatInr, INR, TOOL_ICONS, STATUS_ICONS",
          "copy.js — user-facing strings (addBill, recordPayment, etc.)",
          "profileAvatars.js — cartoon avatars per user mode",
        ],
      },
    ],
  };

  const fileInventory = {
    title: "19. Complete source file inventory",
    body: [
      "Every .jsx/.js file under src/ is listed below by folder. Files marked (test) are Vitest specs.",
    ],
    subsections: [
      {
        h: "19.1 Pages (9)",
        bullets: [
          "Home.jsx, Commitments.jsx, Add.jsx, Lending.jsx, LendingOfferReview.jsx",
          "Analytics.jsx, Tools.jsx, Profile.jsx, Onboarding.jsx",
        ],
      },
      {
        h: "19.2 Components (28)",
        bullets: [
          "AnalyticsChartPanel, BillDetailModal, Card, CategoryChip, CollapsibleSection",
          "CommitmentEditModal, ErrorBoundary, InstallAppBanner, InsuranceCalculatorModal",
          "InsuranceFields, LendingDetailModal, Modal, ModeRoute, Navbar",
          "NotificationPanel, NotificationSync, PageHeaderWithNotifications",
          "PriorityBadge, ProfileAvatar, ThemeSync, ToolWidget",
          "dashboard/: DashboardTools, HomeOverviewCard, RoleDashboardPanel, ToolsDiscoveryPrompt",
          "lending/: LendingDetailDashboard, LendingFormFields, LendingRequestModal",
        ],
      },
      {
        h: "19.3 Engines (21 + 2 tests)",
        bullets: [
          "affordability, analyticsSeries, burden, financialHealth, forecast, forecastSeries",
          "goalsProgress, insightsExtended, insuranceCalculator, intelligence",
          "lendingAgreement, lendingTrust, notifications, payoffOptimizer, payoffPriority",
          "prepayment, pressureAdvanced, pressureScore, reminders, snapshots, subscriptionLeak",
        ],
      },
      {
        h: "19.4 Utils (24 + 4 tests)",
        bullets: [
          "agreementExport, applyUiTheme, basePath, billDates, billDisplayName, billLifecycle",
          "commitmentPayments, commitmentRecurring, commitmentSpendSummary, commitmentStatus",
          "dates, formatBurdenPercent, lendingFinancials, lendingPayments, lendingRecord",
          "lendingStatus, lendingTimeline, migrateStorage, monthPaymentSummary",
          "profileScope, profileStats, theme",
          "repayment/: calculations, payments, schedule, index",
        ],
      },
    ],
  };

  const dataFlow = {
    title: "20. Data flow diagrams (narrative)",
    subsections: [
      {
        h: "20.1 Adding a bill",
        bullets: [
          "1. User fills Add.jsx form → validate()",
          "2. handleSubmit builds draft object with priorSpend estimate",
          "3. addCommitment → normalizeCommitment → normalizeCommitmentStatusForSave",
          "4. localStorage.setItem('commitments')",
          "5. React state updates → Commitments list re-renders",
          "6. Next month: useEffect may append monthlySnapshots entry",
        ],
      },
      {
        h: "20.2 Recording a payment",
        bullets: [
          "1. User enters amount/date on Commitments",
          "2. addCommitmentPayment(id, {amount, date})",
          "3. applyPaymentToCommitment reduces remaining",
          "4. If remaining=0 and recurring: advanceRecurringCommitment returns [paidRow, nextCycle]",
          "5. flatMap replaces one row with one or two rows in storage",
        ],
      },
      {
        h: "20.3 Intelligence pipeline",
        bullets: [
          "1. useCommitIntel reads commitments, settings, snapshots",
          "2. Runs engines: pressure, health, insights, forecast, notifications",
          "3. Home renders cards from intel.* properties",
          "4. NotificationSync may fire browser notifications from reminders",
        ],
      },
    ],
  };

  const formulas = {
    title: "21. Key formulas and algorithms",
    subsections: [
      {
        h: "21.1 EMI (prepayment.js)",
        body: [
          "EMI = P × r × (1+r)^n / ((1+r)^n − 1) where r = annualRate/12/100, n = months. Prepayment simulation adds extra monthly principal to reduce months and interest.",
        ],
      },
      {
        h: "21.2 Pressure score",
        body: [
          "Canonical score 0–100 combines: ratio of monthly burden to income, overdue count weight, trend from last two snapshots if available. Label bands: Comfortable, Watch, Stressed, Critical.",
        ],
      },
      {
        h: "21.3 Trust score (lending)",
        body: [
          "Per person: weighted on-time vs delayed repayments across historical lending entries. Displayed 0–100 on offer review and lending cards.",
        ],
      },
      {
        h: "21.4 Goal progress",
        body: [
          "reduce_open_debt: progress vs baseline open remaining reduction target",
          "income_ratio_cap: progress toward keeping burden ratio below target",
          "save_amount: savedAmount / targetAmount",
        ],
      },
    ],
  };

  return [
    ...CONTENT,
    { part: "PART II — APPLICATION", sections: [routes, storage, contextApi] },
    { part: "PART III — DOMAIN LOGIC", sections: [billLifecycle, engines, lendingFlow] },
    { part: "PART IV — UI & OPS", sections: [components, hooksServices, categories, pwa, tests, limitations] },
    {
      part: "PART V — APPENDIX",
      sections: [utilsRef, constantsRef, fileInventory, dataFlow, formulas],
    },
  ];
}

function renderContent(writer, parts) {
  for (const part of parts) {
    writer.pageBreak();
    writer.h1(part.part, true);
    for (const section of part.sections) {
      writer.h2(section.title);
      if (section.body) section.body.forEach((t) => writer.p(t));
      if (section.bullets) writer.bullets(section.bullets);
      if (section.table) writer.table(section.table.headers, section.table.rows);
      if (section.subsections) {
        for (const sub of section.subsections) {
          writer.h3(sub.h);
          if (sub.body) sub.body.forEach((t) => writer.p(t));
          if (sub.bullets) writer.bullets(sub.bullets);
          if (sub.table) writer.table(sub.table.headers, sub.table.rows);
        }
      }
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });

const doc = new PDFDocument({ margin: 50, size: "A4", bufferPages: true });
const stream = fs.createWriteStream(tmpFile);
doc.pipe(stream);

const writer = new DocWriter(doc);

// Cover
doc.font("Helvetica-Bold").fontSize(26).fillColor(COLORS.brand).text("CommitTrack", 50, 120);
doc.font("Helvetica-Bold").fontSize(16).fillColor(COLORS.heading).text("Complete Technical Documentation", 50, 155);
doc
  .font("Helvetica")
  .fontSize(11)
  .fillColor(COLORS.muted)
  .text("What the app does · How every feature works · Full implementation reference", 50, 185, { width: 400 });
doc.text(`Generated: ${new Date().toLocaleString("en-IN", { dateStyle: "full", timeStyle: "short" })}`, 50, 230);
doc.text(`Schema version: 8 · Source: PROJECTapp repository`, 50, 248);
doc.text("Local-first · React · Vite · PWA · No backend", 50, 266);

writer.pageBreak();
writer.h1("Table of contents (overview)");
writer.bullets([
  "Part I — Overview: purpose, architecture, stack, layout",
  "Part II — Application: routes, pages, storage schema, context API",
  "Part III — Domain logic: bill lifecycle, all engines, lending flows",
  "Part IV — UI & operations: components, hooks, modes, PWA, tests, gaps",
]);

renderContent(writer, buildFullContent());

// Page numbers on all pages
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  if (i === 0) continue;
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted).text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 35, {
    align: "center",
    width: doc.page.width - 100,
  });
}

doc.end();

stream.on("finish", () => {
  try {
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  } catch {
    /* may be open in viewer — keep tmp */
  }
  try {
    fs.renameSync(tmpFile, outFile);
  } catch {
    fs.copyFileSync(tmpFile, outFile.replace(/\.pdf$/, "-new.pdf"));
    console.log("Could not overwrite locked PDF; wrote alternate file.");
  }
  const final = fs.existsSync(outFile) ? outFile : outFile.replace(/\.pdf$/, "-new.pdf");
  const stats = fs.statSync(final);
  console.log(`Wrote ${final}`);
  console.log(`Size: ${(stats.size / 1024).toFixed(1)} KB`);
  try {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  } catch {
    /* ignore */
  }
});
