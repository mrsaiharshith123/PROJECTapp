# Mobile distribution (single web codebase)

Perovo ships as **one Vite/React app** at the repo root. Native store apps are thin wrappers — no Expo / React Native tree.

| Platform | Wrapper | Build path | Command |
|----------|---------|------------|---------|
| **Android dev / sideload** | **Capacitor** (bundled `dist/`) | `releases/` | `npm run apk:dev` |
| **Android Play Store** | **TWA** (live site) | `twa/` | `npm run apk:twa` |
| **iOS App Store** | **Capacitor** | `ios/` (generated) | `npm run cap:ios` |
| **Localhost testing** | Phone shell in browser | `src/ui/dev/` | `npm run dev` |

**Not a consumer web/PWA product** — `vite-plugin-pwa` and install/marketing flows were removed. Browser access is for **development only**, wrapped in a full-screen phone frame on localhost.

## Localhost phone shell

On `npm run dev`, the app renders inside `DevPhoneFrame`:

- Full-screen phone bezel scaled to fill the window
- Top bar: device preset + custom width×height
- Forces mobile bottom nav (no desktop top bar)

Config: `src/utils/devPhoneFrame.js` · UI: `src/ui/dev/DevPhoneFrame.jsx`

## Developer APK (share with remote team)

**Offline APK** — works on any Android device without your laptop.

**Prerequisites:** JDK 17+, [Android Studio](https://developer.android.com/studio) (SDK + `ANDROID_HOME`).

```bash
npm install
npm run apk:dev
```

Output:

- `releases/Perovo-dev-latest.apk` — share this file
- `releases/Perovo-dev-YYYY-MM-DD.apk` — dated copy

Package id: `app.perovo.mobile` (side-by-side with Play Store `app.perovo.twa`).

### Storage on Android

| What | Where Android shows it | Cleared by |
|------|------------------------|------------|
| Bills, settings (local-first) | App **storage** | Clear **data** |
| Capgo OTA web bundle | App **storage** (not APK size) | Clear **data** |
| Downloaded APK before install | App **data** (was cache; fixed in 1.5.x) | Clear **data** |
| Installed APK update | **App size** in Settings | Uninstall only |

**Clear data** wipes OTA updates and all local finances — use **cloud backup** (Pro/Power) before clearing. For version bumps, **install the APK** when prompted so the update lives in the installed app, not only as an OTA patch in data.

OTA hotfixes (same version, newer build) are small patches; full semver bumps should use **APK install**.

## Ship (commit + push + GitHub Release APK)

```bash
npm run ship -- "Describe what changed"
```

Skip APK when only docs/copy changed:

```bash
npm run ship -- --no-apk "Docs only"
```

## Android Play Store (TWA)

Loads the **live production URL** — not a bundled copy.

```bash
npm install -g @bubblewrap/cli   # once
npm run apk:twa
npm run apk:twa:install          # USB device
```

See [`twa/README.md`](../twa/README.md) for keystore + `assetlinks.json`.

## iOS (Capacitor)

**macOS + Xcode required.**

```bash
npm run cap:add:ios    # first time
npm run cap:sync
npm run cap:ios
```

## Maintenance

```bash
npm run roger:all      # full health pass before release
npm run audit:native-shells
```
