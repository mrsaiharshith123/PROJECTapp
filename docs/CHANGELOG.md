# Changelog

Perovo uses [semantic versioning](https://semver.org/). Version source of truth: `package.json` → build writes `public/app-version.json`.

## 1.5.0 — 26 June 2026

**Why this bump:** The app stayed on `1.0.x` while shipping several minor-scale releases (navigation, insights, i18n, mobile, profile). `1.5.0` catches up semver to the product as it exists today.

### Navigation & information architecture
- Ledger hub: assets, liabilities, instruments; bills/spends at `/ledger/bills`, `/ledger/spends`
- Insights hub + dedicated breakdown routes (`/insights/assets`, `/liabilities`, `/instruments`, etc.)
- Legacy `/money/*`, `/profile`, `/analytics` redirects preserved

### Profile & settings (Groww-style)
- Avatar popover: identity, net position, quick links (no duplicate gear/score rows)
- You page: settings list only; personal details merges income, email, city (`/you/personal`)
- Device sessions: dedupe same device, show OS + browser version (e.g. Windows 11 · Chrome 126)

### Product
- Agreements (lending + documents), net worth engines, Perovo Score detail
- 23 locales (English + 22 scheduled languages)
- Local-first cloud backup with manual restore only
- PWA + Capacitor + OTA update path; TWA Android shell

### Quality & docs
- 122 Vitest tests; `npm run audit` blocking checks green
- Project encyclopedia: `docs/encyclopedia/`

---

## 1.0.4 and earlier

Patch releases on the `1.0.x` line: OTA boot fixes, dependency updates, and incremental features that were not reflected in minor version numbers (reason for the jump to `1.5.0`).

Pre-rename history: **CommiTrack** (commitment tracker) evolved into **Perovo** (full financial life OS).
