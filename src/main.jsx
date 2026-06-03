import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./ui/styles/index.css";
import { bootstrapThemeFromStorage } from "./utils/theme.js";
import { applyUiThemeToDocument } from "./utils/applyUiTheme.js";
import App from "./App.jsx";
import ErrorBoundary from "./ui/layout/ErrorBoundary.jsx";

import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

bootstrapThemeFromStorage();
applyUiThemeToDocument();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
