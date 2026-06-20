# Folders at the repo root (what you actually need)

Some paths look like clutter in the file tree. Most are **not duplicated docs** — they serve one job each.

## Keep in git (small, on purpose)

| Path | Keep? | Why |
|------|-------|-----|
| **`.github/workflows/`** | Yes if you use GitHub Pages | One workflow (`deploy-pages.yml`) builds on push to `main` and publishes `dist/`. Delete only if you never deploy via GitHub Actions. |
| **`docs/`** | Yes | Developer handbook (this is the merged documentation). |
| **`src/`, `public/`, `scripts/`** | Yes | The app and tooling. |

## Do not commit — safe to delete anytime

| Path | What it is | Delete locally? |
|------|------------|-------------------|
| **`dist/`** | Output of `npm run build` (production site). CI builds its own copy. | **Yes** — `npm run clean` or delete the folder. Reappears after `npm run build`. |
| **`dev-dist/`** | PWA dev service-worker cache from `vite-plugin-pwa` while `npm run dev` runs. | **Yes** — deleted by `npm run clean`. Recreated next time you run dev with PWA enabled. |
| **`releases/`** | Output of `npm run apk:dev` (developer APK). | **Yes** — gitignored; share the `.apk` file, not the folder. |
| **`android/` / `ios/`** | Capacitor native projects (generated locally). | **Yes** — gitignored; recreated via `npx cap add`. |
| **`node_modules/`** | npm install | Delete only if you plan to run `npm install` again. |
| **`*.log`** (e.g. `i18n-translate-all.log`) | One-off script output | **Yes** — gitignored; safe to delete after batch jobs. |

These are already in **`.gitignore`** — they should not appear in GitHub, only on your machine after build/dev.

## Visual clutter in VS Code / Cursor

The repo includes **`.vscode/settings.json`** hiding `dist`, `dev-dist`, and `node_modules` from the explorer so the tree shows source + docs only.

## Commands

```bash
npm run clean    # remove dist/ and dev-dist/
npm run build    # recreates dist/
npm run dev      # PWA dev SW disabled by default (see vite.config.js)
```

## If you want fewer folders total

| Goal | Action |
|------|--------|
| No GitHub auto-deploy | Remove `.github/workflows/deploy-pages.yml`; deploy manually with `npm run deploy`. |
| No PWA folder in dev | Already set: `devOptions.enabled: false` in `vite.config.js`; service worker registers in production only (`src/main.jsx`). |

**Do not delete `dist` from the build pipeline** — `npm run build` and deploy still need to *create* `dist/`; you just don't store it in git.
