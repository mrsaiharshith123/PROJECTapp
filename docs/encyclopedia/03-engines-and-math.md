# Volume 3 — Engines & Math Logic

Engines live in `src/engines/` — **pure functions**, no React. UI calls hooks (`useStabilityIntel`, `useNetWorthIntel`, `usePerovoScore`) that bundle engine outputs.

Insights return `{ id, tone, params? }` — never hardcoded sentences in engines.

---

## Pressure & burden (cashflow core)

### Monthly burden per bill (`burden.js`)
For each active commitment:

\[
\text{monthlyWeight} = \begin{cases}
\text{amount} & \text{if repeat = monthly} \\
\text{amount} \times \frac{12}{\text{monthsPerYear}} & \text{for quarterly/yearly/etc.}
\end{cases}
\]

Summed → **total monthly obligations**.

### Pressure score (`pressureScore.js`) — 0–100

Conceptually:

\[
\text{pressureRatio} = \frac{\text{monthlyObligations}}{\text{monthlyIncome}} \times 100
\]

Mapped to score (higher obligation ratio → **lower** pressure score = worse). Uses `combinedMonthlyIncome(settings)` including side incomes.

**Drivers:** top commitments by stress weight (`stressContributors.js`).

**Safe to spend (`safeToSpend.js`):**

\[
\text{dailySafe} \approx \frac{\text{income} - \text{obligations} - \text{goalSavings}}{\text{daysLeftInMonth}}
\]

(clamped, privacy-aware)

### Survival months (`survival.js`)

\[
\text{survivalMonths} = \frac{\text{liquidAssets}}{\text{monthlyBurn}}
\]

where burn ≈ obligations + average variable spend. Tiers: critical / low / ok / strong.

---

## Perovo Score (`perovoScore.js`)

Headline **0–100** from four pillars (`metricTaxonomy.js`):

| Pillar | Driven by |
|--------|-----------|
| Cashflow | Pressure, bill health, family stability |
| Savings | Survival months, stability plan |
| Debt | CIBIL-style debt ratio, lending trust |
| Protection | Goals progress, insurance coverage signals |

\[
\text{PerovoScore} = \text{weighted blend of pillar sub-scores}
\]

Bands: ≥80 on track, 40–79 coping, <40 at risk (`perovoTierFromScore`).

---

## Net worth (`engines/netWorth/`)

\[
\text{NetWorth} = \sum \text{assets} + \sum \text{instruments} - \sum \text{liabilities}
\]

- **Assets:** property, liquid cash, market holdings (user-entered values).
- **Liabilities:** loans from bills + informal entries.
- **Instruments:** FD, SIP, insurance cash value, etc.

`lifeScore.js` — holistic 0–100 position score using liquidity + debt health + growth.

---

## Lending trust (`lendingTrust.js`)

Per counterparty:

\[
\text{trust} = f(\text{onTimePayments}, \text{latePayments}, \text{defaults})
\]

Offer review shows borrower's score; accepting offer stores signed agreement metadata.

---

## Bill health (`billHealth.js`)

Per bill 0–100 based on: paid on time, amount vs income, overdue status. Portfolio aggregate for insights.

---

## Tax & paycheck (`incomeTaxEstimate.js`, `salaryBreakdown.js`)

India FY logic: slabs, 80C/80D hints from commitments, HRA from city (`userCity`).

Paycheck view:

\[
\text{takeHome} \approx \text{income} - \text{tax} - \text{PF} - \text{commitments by category}
\]

Education-only trackers: EPF, PPF, NPS, SIP (`*Tracker.js` engines) — projections, not live market data.

---

## Chit fund (`chitFund.js`)

IRR on cashflows, auction advice, installment schedule. Required fields validated before save.

---

## EMI consolidation (`emiConsolidation.js`)

Sorts EMIs by end date; simulates monthly cash **freed** as each ends:

\[
\text{relief}_t = \sum_{\text{EMI ending at } t} \text{monthlyEMI}
\]

---

## Notifications (`notifications.js`, `reminders.js`)

Rule-based feeds: overdue bills, lending due, pressure spikes, subscription end dates. No ML — deterministic thresholds.

---

## Wrong vs right (engines)

| Wrong assumption | Reality |
|------------------|---------|
| Score updates without income | Income = 0 → pressure math degrades gracefully (tests enforce no NaN) |
| Deleting localStorage resets cloud | Cloud optional; local is source of truth until manual restore |
| Insight text in engine file | Must use `id` + i18n key |
| Infinity / NaN in division | Edge-case tests (`03-edge-cases`) require bounded outputs |

---

## Engine test coverage

`npm run audit:engine-tests` lists engines without dedicated tests — advisory. Critical paths covered in `01-fintech-logic` and `03-edge-cases`.
