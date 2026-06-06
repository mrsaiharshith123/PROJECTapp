# Play Store submission via TWA

## Prerequisites

- Node.js 18+
- Java JDK 11+
- Android Studio (for signing key generation)

## Steps

### 1. Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

### 2. Generate a signing keystore (first time only)

```bash
keytool -genkeypair -v \
  -keystore committrack.keystore \
  -alias committrack \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Get the SHA-256 fingerprint:

```bash
keytool -list -v -keystore committrack.keystore
```

Paste the fingerprint into `public/.well-known/assetlinks.json`

### 3. Deploy assetlinks.json

The file at `public/.well-known/assetlinks.json` must be accessible at:

`https://committrack.app/.well-known/assetlinks.json`

Verify:

`https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://committrack.app&relation=delegate_permission/common.handle_all_urls`

### 4. Build the APK

```bash
cd twa
bubblewrap build --manifest twa-manifest.json
```

### 5. Test on device

```bash
bubblewrap install
```

### 6. Submit to Play Store

Upload the generated `app-release-signed.apk` or `.aab` to:

https://play.google.com/console

- App name: CommitTrack
- Category: Finance
- Content rating: Everyone
- Target audience: 18+

## IMPORTANT

- The domain in `twa-manifest.json` must match your live domain exactly
- `assetlinks.json` must be live and accessible before submitting
- TWA requires HTTPS — ensure your deployment has a valid SSL cert
