import "./ui/styles/update-test-minimal.css";
import { notifyNativeAppReady } from "./services/nativeOtaUpdate.js";

document.documentElement.dataset.ui = "ct";
document.documentElement.dataset.theme = "dark";
document.documentElement.classList.add("dark");

async function boot() {
  try {
    await notifyNativeAppReady();
    const { mountUpdateTestShell } = await import("./mountUpdateTestShell.jsx");
    mountUpdateTestShell();
  } catch (err) {
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML =
        '<p style="padding:24px;text-align:center;font-family:system-ui,sans-serif;color:#f0eff9">Update test shell failed to start.</p>';
    }
    console.error("Update test boot failed", err);
  }
}

void boot();
