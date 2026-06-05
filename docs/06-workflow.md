# Developer workflow

## First day setup

1. Clone the repo and `npm install`
2. Read [01-overview.md](./01-overview.md) and [02-project-structure.md](./02-project-structure.md)
3. Copy `.env.example` → `.env` if you need Supabase auth locally
4. `npm run dev` — open the app, click through Home, Commitments, Add, Profile
5. Skim [03-rules.md](./03-rules.md) — especially **UI only in `src/ui/`**

## Adding a feature (checklist)

### New bill field or commitment behavior

1. `utils/migrateStorage.js` / `normalizeCommitment` — schema
2. `engines/` or `utils/commitmentStatus.js` — status rules if needed
3. `ui/features/pages/AddPage.jsx` + `CommitmentEditModal.jsx` — form
4. Test in `utils/__tests__/` or `engines/__tests__/`
5. `npm run audit`

### New dashboard calculator

1. Add tool id in `constants/modeExperience.js` (`MODE_TOOL_DEFS`, mode lists)
2. Build UI in `ui/features/tools/`
3. Wire `activeTool === "your-id"` modal in `ui/features/dashboard/DashboardTools.jsx`
4. `npm run audit:ui-depth` — confirm no `tool-no-handler`

### New page / route

1. `ui/features/pages/MyPage.jsx` — screen
2. `App.jsx` — lazy import + `<Route path="/my" element={<MyPage />} />`
3. `constants/userModes.js` / `Navbar.jsx` — nav item if it belongs in bottom nav
4. `npm run audit:ui-depth`

### Payments (Pro / Power)

1. `constants/subscriptionTiers.js` — tier ids, `PLAN_PRESENTATION`, `PRO_FEATURES`
2. `services/razorpay.js` — client checkout only
3. `ui/features/profile/PlansModal.jsx` — upgrade UI
4. `ui/patterns/ProGate.jsx` — gate features by tier
5. **Before production:** add server-side payment verification (Supabase Edge Function) — do not trust client-only success

### Lending legal export

1. Extend lending record fields in `utils/lendingRecord.js` / context if needed
2. `engines/lendingAgreement.js` — `buildPromissoryNoteText()`
3. `utils/agreementExport.js` — `generateLegalAgreementHtml()`
4. Optional UI: legal-details modal (deferred — see [09-implementation-status.md](./09-implementation-status.md))
5. Tests: `engines/__tests__/numberToWords.test.js`

### New shared UI component

1. `ui/primitives/` or `ui/patterns/`
2. Export from `ui/index.js`
3. Style in `ui/styles/components.css` (`ct-*`)
4. Use from features — do not duplicate in `engines/` or `pages/`

## Code review expectations

Reviewers should see:

- [ ] `npm run audit` passes
- [ ] No UI outside `src/ui/` (except `ct-*` layout)
- [ ] Engine changes have tests when behavior is non-trivial
- [ ] New exports from `ui/index.js` are actually used
- [ ] No secrets in diff

## Branch / deploy

- Default deploy target: GitHub Pages via `npm run deploy`
- Ensure repository secrets for Vite Supabase vars (root README)

## Where to ask questions

| Topic | Doc |
|-------|-----|
| Where does X live? | [02-project-structure.md](./02-project-structure.md) |
| Can I use Tailwind here? | [03-rules.md](./03-rules.md) |
| What does audit check? | [05-audit-and-quality.md](./05-audit-and-quality.md) |
| Product / modes | [01-overview.md](./01-overview.md) + `constants/modeExperience.js` |
| What's built vs planned | [09-implementation-status.md](./09-implementation-status.md) |

## Docs maintenance

- **Single handbook:** `docs/` — update these when structure or audit changes
- **README.md:** Short GitHub-facing summary + link to `docs/`
- **`src/ui/ARCHITECTURE.md`:** Pointer to `docs/`, not a second full copy

When you change audit scripts or `package.json` scripts, update [04-commands.md](./04-commands.md) and [05-audit-and-quality.md](./05-audit-and-quality.md) in the same PR.
