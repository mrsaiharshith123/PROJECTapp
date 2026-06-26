# Volume 5 — File Tree, Storage & Addresses

---

## Top-level repo shape

```
PROJECTapp/
├── src/                 # All application source
│   ├── main.jsx         # React entry
│   ├── App.jsx          # Router + shells
│   ├── app/             # Bridges (CloudSync, Theme, Analytics)
│   ├── boot/            # BootShell loading UI
│   ├── context/         # React contexts (Perovo, Auth, NetWorth)
│   ├── engines/         # Pure finance logic (86 modules)
│   ├── hooks/           # React hooks wrapping engines
│   ├── i18n/            # Provider + messages/*.js (23 locales)
│   ├── services/        # Supabase, sync, device sessions
│   ├── storage/         # localStorage keys
│   ├── ui/              # ALL visual UI (rule: no JSX outside here)
│   ├── utils/           # Helpers (deviceInfo, migrateStorage, tier)
│   └── governance/      # Feature/mode registries (audit source)
├── tests/suites/        # Vitest *.test.mjs (9 files, 122 tests)
├── scripts/             # Audits, i18n sync, build, APK
├── docs/                # Human + agent documentation
├── docs/encyclopedia/   # This encyclopedia set
├── .cursor/rules/       # Cursor agent rules (*.mdc)
├── supabase/            # Migrations, edge functions
├── public/              # PWA icons, app-version.json
├── android/ ios/ twa/   # Native shells
└── dist/ dist-ota/      # Build output (gitignored)
```

---

## `src/ui/` layout

| Folder | Role |
|--------|------|
| `ui/primitives/` | Button, Card, Input — design tokens |
| `ui/patterns/` | BillCard, PageShell, SubPageHeader, modals |
| `ui/layout/` | Navbar, ErrorBoundary, ProfileGlimpseMenu |
| `ui/features/pages/` | Route-level pages |
| `ui/features/<domain>/` | Domain components (home, ledger, profile, insights) |
| `ui/icons/` | CtIcon (Phosphor wrapper) |
| `ui/styles/` | tokens.css, components.css |

**Rule:** New screens → `ui/features/pages/` or `ui/features/<domain>/`. See `03-rules.md`.

---

## Contexts (data flow)

```
AuthContext          → user, profile, signIn/out, isAdmin
PerovoContext        → commitments, spends, goals, lendings, settings, CRUD
NetWorthContext      → wealth entries, privacyMode, net worth intel
I18nProvider         → locale, t()
```

Pages **read** via hooks; **write** via context methods (`addCommitment`, `updateSettings`, …).

Cloud: `CloudSyncBridge` debounces push on data change — **never** pull on startup.

---

## localStorage keys (`src/storage/keys.js`)

Examples:
- `perovo_commitments`, `perovo_spends`, `perovo_wealth`
- `perovo_settings`, `perovo_sync_meta`
- `perovo_device_id` — stable device id for sessions

`migrateStorage.js` handles version upgrades and `clearAllLocalData()` on delete-account.

---

## Services boundaries

| Service | Allowed from |
|---------|--------------|
| `sync/syncEngine.js` | Profile backup UI, CloudSyncBridge, hooks |
| `deviceSessions.js` | Security page only |
| `supabase/auth.js` | Auth, profile, backup |

Feature pages must **not** import `@supabase/supabase-js` directly (audit enforces).

---

## URL → file map (main pages)

| URL | Primary file |
|-----|--------------|
| `/` | `ui/features/pages/HomePage.jsx` |
| `/ledger` | `ui/features/pages/LedgerPage.jsx` |
| `/ledger/bills` | `ui/features/pages/CommitmentsPage.jsx` |
| `/ledger/spends` | `ui/features/pages/SpendsPage.jsx` |
| `/agreements` | `ui/features/pages/AgreementsPage.jsx` |
| `/add` | `ui/features/pages/AddPage.jsx` |
| `/you` | `ui/features/pages/ProfilePage.jsx` (YouPage re-export) |
| `/insights` | `ui/features/pages/AnalyticsPage.jsx` |
| `/insights/score` | `ui/features/pages/ScoreDetailPage.jsx` |
| `/you/personal` | `ui/features/profile/pages/YouPersonalPage.jsx` |

Sub-pages follow `ui/features/profile/pages/You*.jsx`.

---

## Governance registries

| Registry | Path | Audit |
|----------|------|-------|
| Features | `src/governance/registries/features.js` | `audit:features` |
| Modes | `src/governance/registries/modes.js` | `audit:modes` |
| Insights | insight registry scripts | `audit:insight-registry` |

When adding a major feature: register paths here or `audit:registry-sync` fails.

---

## Build & deploy addresses

| Environment | URL pattern |
|-------------|-------------|
| Dev | `http://localhost:5173/PROJECTapp/` |
| GitHub Pages | `https://<user>.github.io/PROJECTapp/` |
| Capacitor APK | `file:///android_asset/` (embedded WebView) |

`public/app-version.json` — OTA version for Capgo updater.

---

## `.cursor/rules/` (agent behavior)

| Rule | Topic |
|------|-------|
| `single-language-i18n.mdc` | No hardcoded UI strings |
| `cloud-sync-local-first.mdc` | No auto-pull; manual restore |
| `project-hygiene.mdc` | Audits, dead code |
| `project-encyclopedia.mdc` | Pointer to this encyclopedia |
| `new-screen-checklist.mdc` | Adding screens |
| `responsive-mobile.mdc` | Mobile layout |
| `icons-no-emoji.mdc` | CtIcon only |

Agents: read encyclopedia before large UI/product changes.
