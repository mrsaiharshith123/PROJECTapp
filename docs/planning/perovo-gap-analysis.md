# Perovo — Complete Gap Analysis
# What's missing, what's duplicated, what needs a prompt.
# Based on full audit of current public.zip vs all previous specs.

═══════════════════════════════════════════════════════════════
SECTION 1 — THE BIG PICTURE: WHERE THINGS STAND TODAY
═══════════════════════════════════════════════════════════════

FROM MEASURING THE CODE RIGHT NOW:
  Total UI feature files:    125
  Files with modern styling:   0  ← ZERO. None of the design tokens
                                    from any of our UI specs were applied.
  tokens.css modern tokens:    0  ← ct-grad-pressure, ct-hero-card,
                                    ct-icon-tile, ct-stat-tile — none exist.
  /money route:            MISSING  ← MoneyPage was never created
  /plan route:             MISSING  ← PlanPage was never created
  /you sub-pages:          MISSING  ← /you/personal, /you/money etc. never created

WHAT THIS MEANS:
  None of the redesign prompts (Home/Money/Plan/You/Admin) were run.
  The app is still using the OLD layout and OLD colors everywhere.
  We have comprehensive specs but zero implementation.
  This is the starting point — not a partial implementation.

═══════════════════════════════════════════════════════════════
SECTION 2 — WHAT'S COMPLETELY MISSING (never built)
═══════════════════════════════════════════════════════════════
These features/pages don't exist in the codebase at all.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2A. ROUTES / PAGES THAT DON'T EXIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /money          → Money tab (Bills + Spends + Lending in one shell) — NOT BUILT
  /plan           → Plan tab (Goals + Calculators + AI) — NOT BUILT
  /you            → "You" tab (replaces /profile with sub-navigation) — NOT BUILT
  /you/personal   → Personal details sub-page — NOT BUILT
  /you/account    → Email & password sub-page — NOT BUILT
  /you/money      → Income & salary sub-page — NOT BUILT
  /you/household  → Household mode sub-page — NOT BUILT
  /you/appearance → Appearance sub-page — NOT BUILT
  /you/security   → Security sub-page — NOT BUILT
  /you/backup     → Data & backup sub-page — NOT BUILT
  /you/notifications → Notifications sub-page — NOT BUILT
  /you/history    → Payment history sub-page — NOT BUILT
  /you/support    → Help & support sub-page — NOT BUILT
  /you/plans      → Plans/upgrade sub-page — NOT BUILT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2B. ANALYTICS — ALMOST ENTIRELY GONE FROM THE APP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The docx confirms: Analytics page still exists at /analytics but it's
NOT in the nav bar. Users can't find it. The analytics features that
SHOULD be in the app but have no clear accessible home:

  ✗ Survival runway (3 scenarios: baseline/stressed/critical) — no dedicated screen
  ✗ Pressure trend chart (6-month history) — nowhere visible
  ✗ Spending breakdown donut (category split) — not accessible from nav
  ✗ Smart finds (subscription leak, positive trends) — no screen
  ✗ PaycheckBreakdown — at /paycheck but not in nav, no one finds it
  ✗ CashflowCalendarStrip — only on Analytics page, which isn't in nav
  ✗ MonthlySpendAnalyticsSection — only on Analytics page
  ✗ BillInsightsCards — only on Analytics page
  ✗ CIBIL score simulation result — only buried in tools
  ✗ Momentum score display — exists in engine, shown nowhere meaningful
  ✗ Income sensitivity analysis — only on Analytics page (unreachable)
  ✗ EMI consolidation plan — only on Analytics page (unreachable)
  ✗ Credit card pressure analysis — only on Analytics page (unreachable)

  WHERE ANALYTICS SHOULD LIVE (per spec):
    - Survival + pressure trend → in Money tab's "Insights" sub-section
    - Spending breakdown → in Money tab's Spends view
    - PaycheckBreakdown → in Money tab (salary context)
    - Smart finds → on Home (one-line good news) + Money tab
    - CIBIL sim → in Plan tab's Growth section
    - Everything else → Money → Insights (accessible from nav)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2C. NET WORTH — BUILT BUT HIDDEN AND DISCONNECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net worth has EXCELLENT engines (10 sub-engines) and a page (/profile/analytics
or /net-worth both map to ProfileWealthAnalyticsPage). But:

  ✗ NOT in the nav bar — users can't find it
  ✗ NOT in Home hero (net worth number not shown anywhere prominent)
  ✗ LiquidityPanel exists but only shows on /profile/analytics
  ✗ HealthScorePanel exists but only shows on /profile/analytics
  ✗ Wealth simulation (PRESET_SCENARIOS) — exists in engine, no UI entry point
  ✗ Milestones panel — exists in ProfileMilestonesPanel, buried in profile
  ✗ WealthEntryCard / WealthEntryModal — the UI to ADD assets and liabilities
    exists but is only reachable from /profile/analytics (users don't know this)
  ✗ NetWorthIntelligencePanels (LiquidityPanel, HealthScorePanel) — only at
    ProfileWealthAnalyticsPage, which is not in the main nav

  WHERE NET WORTH SHOULD LIVE (per spec):
    - Net worth headline number → You tab hero (tappable)
    - Full net worth management → Money tab (dedicated section)
    - Wealth simulation → Plan tab (Growth section)
    - Milestones → You tab or Plan tab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2D. PLAN TAB — COMPLETELY MISSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The /tools route exists but there is no /plan page.
Tools are accessible but discoverable only if users somehow go to /tools —
there's no nav tab pointing to them directly.

  ✗ PlanPage — does not exist
  ✗ PlanGoalsSection — does not exist (GoalsToolPanel is a tool, not a section)
  ✗ PlanCalculatorsSection — does not exist
  ✗ PlanGrowthSection — does not exist
  ✗ PlanAISection — does not exist
  ✗ PlanToolSheet (bottom sheet for tools) — does not exist
  ✗ "Target" nav tab icon pointing to /plan — does not exist

  TOOLS THAT EXIST BUT ARE HARD TO REACH:
    GoalsToolPanel, IncomeTaxPanel, RetirementPlannerPanel, InvestSavingsPanel,
    ChitFundAdvisor, LoanPayoffAdvisor, LoanToolsPanel, BondAdvisor,
    SafetyPlannerPanel, MoneyPlannerPanel, UnifiedScenariosPanel,
    ExpenseSimulatorForm, FinancialAdvisorTool — all exist but live at /tools
    which has no nav tab entry.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2E. DESIGN TOKENS — NOTHING APPLIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✗ --ct-grad-pressure, --ct-grad-wealth, --ct-grad-survival — don't exist in CSS
  ✗ --ct-glow-indigo, --ct-glow-teal, --ct-glow-amber — don't exist
  ✗ --ct-grad-primary-btn — doesn't exist
  ✗ .ct-hero-card — doesn't exist
  ✗ .ct-stat-tile — doesn't exist
  ✗ .ct-icon-tile — doesn't exist
  ✗ .ct-attention-row — doesn't exist
  ✗ .ct-conic-ring — doesn't exist
  ✗ .ct-settings-row (modern version) — doesn't exist
  ✗ .ct-icon-tile-sm (colored small tiles for settings rows) — doesn't exist

  The entire UI redesign (Home/Money/Plan/You/Admin specs) assumes these
  tokens exist. NONE of them were applied. Prompt S1 from the Plan spec
  is the prerequisite for all redesign prompts.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2F. WHAT THE DOCX SAYS IS MISSING (things removed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The docx identifies items from the OLD version that are now gone:

  ✗ HomeInsightsSection — removed from Home. Partially re-spec'd as a
    "good news" line in our Home spec but never rebuilt.
  ✗ HomeOverviewCard — removed from current Home render.
    Our spec replaced it with the hero but that hero is old-UI.
  ✗ Upcoming payments section on Home — removed. Spec says goes to Bills.
    Neither is rebuilt.
  ✗ Goals mini-card on Home — removed. Spec says goes to Plan. Not built.
  ✗ LendingProfileCard (rich trust header) — replaced with simpler summary.
    Trust rows still exist in engine, not prominently shown anywhere.

═══════════════════════════════════════════════════════════════
SECTION 3 — DUPLICATIONS STILL IN THE APP (measure, not guess)
═══════════════════════════════════════════════════════════════
These concepts appear on MULTIPLE screens with no differentiation,
causing the "bro what am I even looking at" problem the architecture
critique described. All measured from your actual code:

  PRESSURE SCORE shown on:
    HomeOverviewCard → FinancialPulseCard → AnalyticsPage →
    ProfileScoresDetailPage → WealthAnalyticsSection → PaycheckPage
    = 6 different places showing the SAME number with DIFFERENT names
    ("Pressure", "Score", "Financial health", "Stability", etc.)

  NET WORTH shown on:
    HeroMonthCard → ProfilePersonalSection → ProfileFinancialHero →
    ProfileMilestonesPanel → ProfileNetWorthSection → ProfileBackupSection →
    LendingProfileCard → NetWorthIntelligencePanels
    = 8 places. Every profile sub-section re-shows net worth.

  OVERDUE ITEMS shown on:
    HomeInsightsSection → HomeOverviewCard → CommitmentsBillsTab →
    FinancialPulseCard → LendingOverduePanel → PaymentDeadlineCalendarModal →
    AnalyticsPage → (via SchoolFeeCard on Analytics)
    = 8 places. Overdue is shown EVERYWHERE, diluting urgency.

  FREE CASH / SAFE TO SPEND shown on:
    HomeOverviewCard → SafeToSpendCard → HeroMonthCard → GoalsToolPanel →
    InvestSavingsPanel → IncomeTaxPanel → ExpenseSimulatorForm →
    FamilyModeDashboard
    = 8 places. Two different concepts (free cash vs safe-to-spend-daily)
    shown inconsistently across pages.

  SURVIVAL MONTHS shown on:
    FinancialPulseCard → FamilyModeDashboard → UnifiedScenariosPanel →
    MoneyPlannerPanel → ExpenseSimulatorForm → FinancialAdvisorTool →
    NetWorthIntelligencePanels → LogSpendModal → DailySpendPanel
    = 9 places. Even in the LogSpend modal when you're logging a coffee purchase.

  WHAT SHOULD BE DONE:
    Each concept has ONE primary home. All other appearances are either
    removed or reduced to a ONE-LINE cross-reference that links to the owner.
    (As spec'd: pressure score → owned by Home hero; survival → owned by
    Money/Insights; net worth → owned by Money net worth section; etc.)

═══════════════════════════════════════════════════════════════
SECTION 4 — WHAT WAS SPEC'D BUT NEVER IMPLEMENTED
═══════════════════════════════════════════════════════════════
Everything in the 5 spec files (Home, Money, Plan, You, Admin).
In order of user impact:

  HIGHEST IMPACT (users see immediately):
  ✗ Design tokens (Prompt S1) — zero tokens applied, zero redesign works without this
  ✗ Nav tabs renamed: Home/Money/Plan/You + FAB — still old: Home/Bills/+/Lending/Profile
  ✗ Home hero: conic pressure ring + "Perovo Score" rename + 2 stat tiles
  ✗ Safe-to-spend folded into hero caption (kills duplicate money number)
  ✗ HomeNeedsAttention as the ONE attention block (kills duplicate overdue)
  ✗ Exactly 4 quick actions (Add/Scan/Spend/Calc as icon tiles)
  ✗ Home tools entry row (instead of full grid on Home)

  HIGH IMPACT (users hit within first 2 minutes):
  ✗ MoneyPage (/money) with 3-pill switcher (Bills/Spends/Lending)
  ✗ Bills hero summary tile (committed total + bar)
  ✗ Bills filter reduced to 4 chips (from 13 simultaneous controls)
  ✗ Category picker as bottom-sheet icon grid (not a <select>)
  ✗ Lending hero (you're owed left / you owe right split)
  ✗ Lending overflow menu (from 4 header buttons)
  ✗ Add screen 2-step flow (type picker → form)
  ✗ Scan bill as first option in Add flow
  ✗ Affordability chip inline below amount field

  MEDIUM IMPACT (users discover over time):
  ✗ PlanPage (/plan) with Goals hero + 2-column tool grid
  ✗ Tools open as bottom sheets (not full-screen modals)
  ✗ Retirement featured tile (full-width corpus hero)
  ✗ Analytics in Money tab (survival, pressure trend, spending donut)
  ✗ Net worth in Money tab (with liquidity bar, life score, debt health)
  ✗ Wealth simulation in Plan tab

  LOWER IMPACT but needed for completeness:
  ✗ You tab push navigation (9 sub-pages)
  ✗ Settings colored icon tiles
  ✗ Identity hero with 3 vital stats
  ✗ Admin: 5 new sections (Revenue, Feature Adoption, User Health,
    Distribution, System Health)
  ✗ Admin command bar + enhanced user rows
  ✗ Motion: conic ring draw, card stagger, tab cross-fade, sheet slide
  ✗ Empty states: warm empty with suggestions (not blank gray cards)
  ✗ Skeleton loading (not spinners)

═══════════════════════════════════════════════════════════════
SECTION 5 — THE EXECUTION PLAN (what to actually run, in order)
═══════════════════════════════════════════════════════════════
Run these in STRICT ORDER. Everything downstream depends on what's above.

PHASE 1 — FOUNDATION (no UI specs work without these 2 prompts)
  Run: perovo-plan-shapes-FULL-spec.md → Prompt S1
       (Adds all design tokens + fixes buttons/cards/inputs globally)
  Run: userModes.js nav update + App.jsx route structure
       (Changes nav to Home/Money/Plan/You + creates /money, /plan routes)
  VERIFY: tokens visible in browser devtools, nav shows 4 tabs + FAB.

PHASE 2 — HOME (highest visible impact, what users see first)
  Run: perovo-home-FULL-spec.md → H1 through H6
  VERIFY: conic ring, 2 stat tiles, 4 actions, 1 attention section,
          no duplicate money number, no duplicate overdue section.

PHASE 3 — MONEY + ADD
  Run: perovo-money-add-FULL-spec.md → M1 through M5
  VERIFY: /money loads with 3-pill switcher, bills have hero summary tile,
          Add screen shows type picker first, scan tile appears before form.

PHASE 4 — PLAN
  Run: perovo-plan-shapes-FULL-spec.md → S2 through S6
  VERIFY: /plan loads with Goals hero at top, 2-column tool grid,
          tools open as bottom sheets.

PHASE 5 — ANALYTICS INTO MONEY (the missing analytics)
  These were spec'd as part of Money but need their own explicit prompt
  since Analytics currently lives separately. See Section 6 below.

PHASE 6 — YOU TAB
  Run: perovo-you-admin-FULL-spec.md → Y1 through Y4

PHASE 7 — ADMIN
  Run: perovo-you-admin-FULL-spec.md → A1 through A2

PHASE 8 — UI COMPLETION SWEEP
  Run: perovo-ui-FULL-completion.md → Prompts 1-8
  (This is the 145-files sweep that applies modern CSS to all remaining files)

═══════════════════════════════════════════════════════════════
SECTION 6 — THE MISSING ANALYTICS PROMPT (not written yet)
═══════════════════════════════════════════════════════════════
This is the one area not covered by any existing spec. It needs its own prompt.

The problem: Analytics at /analytics is not in the nav. Users can't find it.
The engine content inside it is extremely valuable:
  - buildCashflowForecastSeries (30-day cashflow forecast)
  - buildIncomeSensitivityRows (how income changes affect pressure)
  - analyzeCreditCardPressure (credit card-specific stress)
  - buildEmiConsolidationPlan (simplify multiple EMIs into one)
  - PaycheckBreakdown (salary anatomy: gross/deductions/net)
  - CashflowCalendarStrip (day-by-day calendar of what's due when)
  - MonthlySpendAnalyticsSection + BillInsightsCards
  - WealthAnalyticsSection (liquidity/life score/health score panels)

WHERE EACH SHOULD GO:
  Money tab → "Insights" sub-section (4th pill after Bills/Spends/Lending):
    - CashflowCalendarStrip (calendar of due dates — money timing)
    - MonthlySpendAnalyticsSection (spending by category)
    - BillInsightsCards (bill-specific insights)
    - HouseholdSpendPanel (family spending, if household mode)
    - buildCashflowForecastSeries (30-day forecast)
    - EMI consolidation plan (debt simplification — belongs in Money)
    - PaycheckBreakdown (also belongs in Money context)

  Plan tab → Growth section:
    - WealthAnalyticsSection (net worth + liquidity + life score)
    - Income sensitivity rows (planning tool)
    - Credit card pressure (advisory)

  /analytics route:
    Keep it as a deep-link destination (for sharing specific views)
    but the PRIMARY access is now through Money → Insights.

NEEDS NEW PROMPT: "Analytics into Money" — adds a 4th pill "Insights"
to the Money 3-pill switcher and populates it with the above content.
This is the single biggest missing piece that brings buried engine
value to the surface.

═══════════════════════════════════════════════════════════════
SECTION 7 — DUPLICATIONS TO KILL (priority order)
═══════════════════════════════════════════════════════════════
Kill these in order as pages are rebuilt. Each duplicate removed
makes the remaining content feel more meaningful:

KILL 1: Two "money available" numbers on Home
  Remove SafeToSpendCard from Home (fold daily-safe into hero caption).
  → Already spec'd in Home H2. Run it.

KILL 2: Two "attention" sections on Home
  HomeInsightsSection duplicates HomeNeedsAttention for overdue.
  Remove HomeInsightsSection from Home.
  → Already spec'd in Home H2. Run it.

KILL 3: Pressure score on 6 different screens
  After Home and Analytics are rebuilt, add a rule:
  Pressure score is DISPLAYED on Home (hero) and DETAILED on Money/Insights.
  Everywhere else it appears as a ONE-LINE cross-reference link only.
  Files to fix: PaycheckPage, ProfileScoresDetailPage, WealthAnalyticsSection
  (show a small chip "Perovo Score: 72 · See details →" not the full card).

KILL 4: Net worth on 8 different screens
  After Money tab is built, net worth is DISPLAYED in the You hero
  and DETAILED in Money/NetWorth. Everywhere else: a one-line chip link.
  Remove the net worth number from: ProfilePersonalSection,
  ProfileBackupSection, LendingProfileCard (these don't need it).

KILL 5: Overdue on 8 different screens
  After Home and Money are rebuilt, overdue alerts have ONE home:
  Home's Needs Attention section (for upcoming/today) and Money/Bills
  (for browsing history). Remove overdue indicators from: FinancialPulseCard,
  PaymentDeadlineCalendarModal (keep it as a modal but remove the redundant
  card-level overdue badge), SchoolFeeCard (remove overdue integration).

KILL 6: Survival months on 9 different screens
  After Money/Insights is built, survival lives there.
  Remove it from: LogSpendModal (why is survival in the add-spend modal?),
  DailySpendPanel (not relevant when browsing spend history),
  MoneyPlannerPanel (show it once in Insights, link from here).

═══════════════════════════════════════════════════════════════
SECTION 8 — STATUS SUMMARY TABLE
═══════════════════════════════════════════════════════════════
  ITEM                              SPEC EXISTS?   IMPLEMENTED?
  ────────────────────────────────────────────────────────────
  Design tokens (S1)                    ✓               ✗
  Nav: Home/Money/Plan/You              ✓               ✗
  Home redesign (H1-H6)                 ✓               ✗
  Money tab (/money)                    ✓               ✗
  Add 2-step flow                       ✓               ✗
  Plan tab (/plan)                      ✓               ✗
  Goals section in Plan                 ✓               ✗
  Tools as bottom sheets                ✓               ✗
  Analytics → Money/Insights            partial         ✗
  Net worth → Money tab                 partial         ✗
  You tab sub-pages                     ✓               ✗
  Settings colored icon tiles           ✓               ✗
  Admin 5 new sections                  ✓               ✗
  Admin command bar                     ✓               ✗
  UI completion sweep (145 files)       ✓               ✗
  Kill duplicate pressure/score x6      ✓               ✗
  Kill duplicate net worth x8           ✓               ✗
  Kill duplicate overdue x8             ✓               ✗
  Kill duplicate free cash x8           ✓               ✗
  Kill duplicate survival x9            ✓               ✗
  Analytics accessible from nav         ✗ (needs prompt) ✗
  Paycheck in Money context             ✗ (needs prompt) ✗
  NetWorth entry in Money nav           ✗ (needs prompt) ✗
  Wealth simulation entry in Plan       ✗ (needs prompt) ✗
