import { bootstrapThemeFromStorage } from "./utils/theme.js";
import { applyUiThemeToDocument } from "./utils/applyUiTheme.js";
import { notifyNativeAppReady } from "./services/nativeOtaUpdate.js";

bootstrapThemeFromStorage();
applyUiThemeToDocument();

async function boot() {
  try {
    await notifyNativeAppReady();
    await import("./renderApp.jsx");
  } catch (err) {
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML =
        '<p style="padding:24px;text-align:center;font-family:system-ui,sans-serif;color:#f0eff9">Perovo could not start. Close the app and open it again.</p>';
    }
    console.error("Perovo boot failed", err);
  }
}

void boot();
