# Mobile distribution (single web codebase)

Perovo ships as **one Vite/React PWA** at the repo root. Native store apps are thin wrappers — no Expo / React Native tree.

| Platform | Wrapper | Build path | Command |
|----------|---------|------------|---------|
| **Web / PWA** | Service worker + manifest | `dist/` | `npm run build` |
| **Android Play Store** | **TWA** (live site) | `twa/` | `npm run apk:twa` |
| **Android dev / sideload** | **Capacitor** (bundled `dist/`) | `releases/` | `npm run apk:dev` |
| **iOS App Store** | **Capacitor** | `ios/` (generated) | `npm run cap:ios` |

## Developer APK (share with remote team)

**Offline APK** — works on any Android device without your laptop or Expo.

**Prerequisites:** JDK 17+, [Android Studio](https://developer.android.com/studio) (SDK + `ANDROID_HOME`).

```bash
npm install
npm run apk:dev
```

Output:

- `releases/Perovo-dev-latest.apk` — share this file (WhatsApp, Drive, etc.)
- `releases/Perovo-dev-YYYY-MM-DD.apk` — dated copy

First run adds the `android/` folder via Capacitor. Re-run after web changes to refresh the bundle.

**Without SDK / Gradle:** build stops after sync — open Android Studio:

```bash
npm run cap:android
# Build → Build APK(s)
```

Package id: `app.perovo.mobile` (side-by-side with Play Store `app.perovo.twa`).

## Ship (commit + push + GitHub Release APK)

One command publishes code **and** attaches the latest APK to GitHub Releases (web landing download button):

```bash
npm run ship -- "Describe what changed"
```

Steps: `git add` → commit → push → `npm run apk:dev` → `gh release create … --latest`.

**Prerequisites (one-time):**

```bash
winget install GitHub.cli
gh auth login
```

Skip APK when only docs/copy changed:

```bash
npm run ship -- --no-apk "Docs only"
```

Download URL (landing page): `…/releases/latest/download/Perovo-dev-latest.apk`

## Android Play Store (TWA)

Loads **https://perovo.app** — not a bundled copy.

```bash
npm install -g @bubblewrap/cli   # once
npm run apk:twa                  # signed APK/AAB in twa/
npm run apk:twa:install          # USB device
```

See [`twa/README.md`](./twa/README.md) for keystore + `assetlinks.json`.

## iOS (Capacitor)

**macOS + Xcode required.**

```bash
npm install
npm run build
npx cap add ios          # first time
npm run cap:sync
npm run cap:ios
```

## Embedded vs browser

| Signal | Meaning |
|--------|---------|
| `display-mode: standalone` | PWA installed from browser |
| TWA / Capacitor | `isEmbeddedApp()` true — no install prompts |
| `VITE_EMBEDDED_APP=1` | Build-time flag for bundled shells |

## Local dev

```bash
npm run dev    # http://localhost:5173
```

## Governance

```bash
npm run audit:native-shells
```

Checks `capacitor.config.ts`, `twa/twa-manifest.json`, scripts, no legacy `appversion/` folder.
