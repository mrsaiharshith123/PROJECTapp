# Volume 1 — Routes & Navigation

Base path in dev: `http://localhost:5173/PROJECTapp` (see `routerBasename()` in `src/utils/basePath.js`).

---

## App shells (which tree you are in)

| Shell | When | Routes |
|-------|------|--------|
| **Marketing** | `site:customer-on` | Landing, `/privacy`, `/auth/confirm` |
| **Auth gate** | Not logged in | `/auth` only |
| **Onboarding** | Logged in, setup incomplete | `/onboarding`, `/privacy` |
| **Main** | Setup complete | All product routes + navbar |
| **Update test** | `isUpdateTestShell()` | OTA test shell only |

Flow: `BootShell` → auth ready → `OnboardingShell` if `!isAccountSetupComplete` → `MainShell`.

---

## Bottom navigation (always visible except sub-pages)

Defined in `src/constants/userModes.js` → rendered in `Navbar.jsx`.

| Label | Path | Active also on |
|-------|------|----------------|
| Home | `/` | — |
| Ledger | `/ledger` | `/ledger/*`, legacy `/money/bills`, `/money/spends`, `/commitments` |
| **+ (FAB)** | `/add` | Radial menu (see below) |
| Agreements | `/agreements` | `/lending`, `/money/lending` |
| Insights | `/insights` | `/insights/*`, `/analytics` |

**Hidden navbar:** paths starting with `/you/` or `/insights/` (sub-pages use `SubPageHeader` back).

**You is NOT in bottom nav.** Open via header **avatar** (last icon: privacy → bell → **H**).

---

## Center FAB (+) menu

| Action | Destination |
|--------|-------------|
| Add commitment | `/add` |
| Scan bill | `BillScannerTool` modal |
| Log daily spend | `LogSpendModal` |
| Record agreement | `/agreements` with `openRequest: true` |

Long-press `+` → opens `LogSpendModal` directly.

---

## Profile glimpse (avatar popover)

| Row | Click goes to |
|-----|----------------|
| Net position (amount) | `/ledger` |
| Account & settings | `/you` |
| Bills | `/ledger/bills` |
| Insights | `/insights` |
| Sign out | signs out |

No gear icon (settings live on `/you` list). No duplicate Perovo Score row.

---

## Main routes

| Path | Page | In nav? |
|------|------|---------|
| `/` | Home | Yes |
| `/ledger` | Ledger (assets/liabilities/instruments) | Yes |
| `/ledger/bills` | Bills & commitments | Via Ledger chip / Bills row |
| `/ledger/spends` | Variable spends | Via spends links |
| `/agreements` | Lending + legal docs | Yes |
| `/add` | Add type picker | FAB |
| `/you` | Settings hub | Avatar only |
| `/insights` | Insights hub | Yes |
| `/insights/score` | Perovo Score detail | From score cards |
| `/insights/spending` | Monthly spending breakdown | From hub section |
| `/insights/spending/yearly` | Yearly breakdown | From hub |
| `/insights/networth` | Net worth overview | From hub |
| `/insights/assets` | Assets breakdown | From hub / ledger |
| `/insights/liabilities` | Liabilities breakdown | From hub / ledger |
| `/insights/instruments` | Instruments breakdown | From hub / ledger |
| `/insights/cashflow` | Cashflow breakdown | From hub |
| `/insights/pulse` | Financial pulse breakdown | From hub |
| `/you/personal` | Personal + income + email + city | Settings row |
| `/you/appearance` | Theme (+ language on same component part) | Settings row |
| `/you/security` | Sessions & account meta | Settings row |
| `/you/backup` | Cloud backup, export, import | Settings row |
| `/you/notifications` | Bill reminders & push | Settings row |
| `/you/history` | Payment history | Settings row |
| `/you/support` | Help & replay guide | Settings row |
| `/you/about` | About, privacy link | Settings row |
| `/you/tools` | Goals + calculators + growth | Tools links / Add goal |
| `/you/plans` | Subscription modal → back to `/you` | Settings row |
| `/admin` | Admin dashboard | Admin FAB (role gated) |
| `/privacy` | Privacy policy | Support / about |
| `/lend/offer` | Accept lending offer (shared link) | External |

---

## Redirects (bookmarks still work)

| Old path | New path |
|----------|----------|
| `/profile` | `/you` |
| `/profile/scores`, `/score-detail` | `/insights/score` |
| `/money`, `/commitments` | `/ledger/bills` |
| `/money/spends` | `/ledger/spends` |
| `/money/lending`, `/lending` | `/agreements` |
| `/analytics` | `/insights` |
| `/plan`, `/tools` | `/you/tools` |
| `/paycheck` | `/insights?card=paycheck` |
| `/net-worth` | `/ledger` |
| `/you/account`, `/you/money` | `/you/personal` |
| `/you/household`, `/family-room` (removed) | `/you` |
| `/auth` (inside main shell) | `/you` |
| Unknown `*` | `/` |

---

## Header actions (most pages)

Order in `AppHeaderActions`: **privacy eye** → optional aux → **bell** → **avatar (last)**.

- Privacy toggle: masks amounts app-wide (`privacyMode` in `NetWorthContext`).
- Bell: `NotificationPanel` slide-over.
- Avatar: `ProfileGlimpseMenu` popover (not direct navigation).
