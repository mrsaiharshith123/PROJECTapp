# Digital Asset Links

Replace `REPLACE_WITH_YOUR_KEYSTORE_SHA256_FINGERPRINT` in `assetlinks.json`
with the SHA-256 fingerprint from your Android signing keystore.

Get it by running:

```bash
keytool -list -v -keystore perovo.keystore
```

This file must be deployed at:

`https://perovo.app/.well-known/assetlinks.json`
