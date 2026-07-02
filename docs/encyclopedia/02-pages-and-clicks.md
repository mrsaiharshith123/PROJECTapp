# Volume 2 — Pages, Clicks & UX Logic

For each surface: **what you see**, **what a click does**, **math/system behavior**, **wrong vs right input**.

---

## Home (`/`)

### Sections
1. **Greeting + header** — time-based hello; tier chip opens `PlansModal` (Pro/Power).
2. **Net position hero** — shows net worth and pressure ring.
   - Tap net → `/ledger`
   - Tap score area → `/insights?card=score`
3. **Your position tiles** — Assets, Liabilities, Instruments, Agreements totals.
   - Each tile → correct ledger tab or `/agreements`
4. **Needs attention** — overdue bills, overdue lending, bills due in 4–7 days.
   - Bill row → `/ledger/bills` (with highlight state if implemented)
   - Lending row → `/agreements`
5. **Good news** — optional positive insight (engine-driven).
6. **Tools preview** — tax / loan / safety shortcuts → `/you/tools?tool=…`

### Wrong vs right
| Wrong | Right |
|-------|-------|
| Expecting net worth without any ledger entries | Add assets/liabilities or bills so engines have data |
| Ignoring "needs attention" | Pay or reschedule bills; record lending payments |

---

## Ledger (`/ledger`)

### Tabs: Assets · Liabilities · Instruments
Query: `?tab=assets|liabilities|instruments`. State can pass `openAdd: true` from Add picker.

| Tab | Add button | Insights link | Empty state CTA |
|-----|------------|---------------|-----------------|
| Assets | `WealthEntryModal` (property, liquid, market) | `/insights/assets` | Add first asset |
| Liabilities | Modal (loans + informal) | `/insights/liabilities` | Add liability |
| Instruments | Modal (FD, SIP, insurance, etc.) | `/insights/instruments` | Add instrument |

**Chip in header:** Bills → `/ledger/bills`.

### Bills (`/ledger/bills`)
- **Hero:** total monthly burden (sum of active commitments normalized to monthly).
- **Actions:** Export Excel, payment calendar modal, SMS detect, Add → `/add`.
- **List:** search, category filters, active vs history.
- **Bill card tap:** `BillDetailModal` → pay, edit, insights.
- **Wrong:** end date before start, zero amount → form validation blocks save.
- **Right:** repeat type + amount + dates → `burden.js` computes monthly weight.

### Spends (`/ledger/spends`)
- Log spend, SMS import, bank import (Pro).
- Daily panel groups by date; feeds lifestyle burn engines.

---

## Agreements (`/agreements`)

### Tabs: Lent · Borrowed · Documents

| Action | Result |
|--------|--------|
| Request money | `LendingRequestModal` → shareable offer link |
| Enter lender code | `LendingAcceptCodeModal` |
| Card → Make legal | Detail dialog, agreement text lock |
| Card → Record payment | Payment dialog updates trust score |
| Export Excel | Spreadsheet of agreements |

**Trust score math:** `lendingTrust.js` — on-time vs late payments → 0–100 per person.

**Free tier:** limited active lending records (`tierHasFeature("unlimited_lending")`).

---

## Add (`/add`)

| Picker choice | Goes to |
|---------------|---------|
| Asset | `/ledger?tab=assets&openAdd` |
| Liability | `/ledger?tab=liabilities&openAdd` |
| Instrument | `/ledger?tab=instruments&openAdd` |
| Goal | `/you/tools` |
| Cashflow / spend | `/ledger/spends` |

---

## Insights (`/insights`)

Hub built from `insightSectionsConfig.js`. Each section has carousel cards; "View breakdown" → dedicated `/insights/*` page (no duplicate back-line on hub — uses `PageShell` like other nav pages).

| Section | Cards | Breakdown route |
|---------|-------|-----------------|
| Monthly | spending, paycheck | `/insights/spending` |
| Yearly | yearly burden, yearly spend | `/insights/spending/yearly` |
| Stability | pulse, cashflow | `/insights/pulse`, `/insights/cashflow` |
| Score | Perovo score | `/insights/score` |
| Net worth | assets, liabilities, instruments | `/insights/networth` + per-type routes |

Header: Spends history → `/ledger/spends`.

---

## You — Settings hub (`/you`)

**Groww-style:** flat list only — no goals card, no identity hero (that's in avatar popover).

### Account group
| Row | Opens | Contains |
|-----|-------|----------|
| Personal details | `/you/personal` | Name, phone, income, salary day, mode, email, city, PAN |
| Subscription | `/you/plans` | Plans modal |
| Look and language | `/you/appearance` | Theme; language picker |

### Privacy & security group
| Row | Behavior |
|-----|----------|
| Privacy mode | Toggle inline (mask amounts) |
| Security & sessions | `/you/security` — device list, deduped sessions |
| Notifications | `/you/notifications` |
| Data & backup | `/you/backup` |
| Payment history | `/you/history` |

### Support group
Update app, Help, About.

### Footer
Sign out, Delete all data (type `DELETE` to confirm).

### Personal details (`/you/personal`) — merged page
**Identity:** display name, phone, avatar, multi-profile (Pro, non-family).

**Money setup:** monthly income, secondary income (family salaried), income basis (gross vs take-home), salary credit day (links to paycheck insight), side incomes, user mode.

**Account/KYC:** email (read-only row), city select, username, PAN, save KYC to Supabase profile.

| Wrong | Right |
|-------|-------|
| Income = 0 with heavy bills | Set realistic monthly income for pressure score |
| Invalid PAN format | 10-char valid PAN or leave empty |
| Salary day 0 or 32 | 1–31 or empty |

### Security (`/you/security`)
- Lists devices with **OS + browser version** (e.g. `Windows 11 · Chrome 126`).
- Duplicate sessions (same PC, new device_id after storage clear) **auto-merge** to one row.
- Revoke other device → marks `revoked_at` in Supabase `user_device_sessions`.

### Backup (`/you/backup`)
- **Enable cloud:** pushes local snapshot; does NOT pull on toggle.
- **Restore:** manual modal only; empty remote never wipes local (`syncEngine.js` guards).
- Export JSON, import merge/replace, CA export (Pro), annual report.

---

## Tools (`/you/tools`)

1. **Goals** — `PlanGoalsSection`: create goal, suggested chips, progress.
2. **Calculators** — tax, loan payoff, safety, chit, etc. (`PlanCalculatorsSection`).
3. **Growth** — SIP, bond, retirement tiles (`PlanGrowthSection`).

`?tool=loan|tax|…` deep-opens calculator sheet.

---

## Onboarding (`/onboarding`)

Collects display name, income, mode, language. Until `isAccountSetupComplete`, user cannot reach main shell.

**Replay:** `/you/support` → review setup → `/onboarding?replay=1`.

---

## Lending offer review (`/lend/offer?code=…`)

Borrower shares link; lender signs name + checkbox → creates `lending` record with locked agreement text.

**Wrong:** empty signature or unchecked box → Accept disabled.  
**Right:** signed record appears under Agreements → Lent.
