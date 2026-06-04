import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ui/styles/index.css";
import { bootstrapThemeFromStorage } from "./utils/theme.js";
import { applyUiThemeToDocument } from "./utils/applyUiTheme.js";
import App from "./App.jsx";
import ErrorBoundary from "./ui/layout/ErrorBoundary.jsx";
import { log } from "./utils/logger.js";

import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

bootstrapThemeFromStorage();
applyUiThemeToDocument();
log.app.info("CommitTrack starting", { mode: import.meta.env.MODE });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
