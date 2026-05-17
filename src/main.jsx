import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { bootstrapThemeFromStorage } from "./utils/theme.js";
import { applyUiThemeToDocument } from "./utils/applyUiTheme.js";
import { isEnhancedUi } from "./constants/uiTheme.js";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

bootstrapThemeFromStorage();
applyUiThemeToDocument();
if (isEnhancedUi()) {
  import("./styles/ui-enhanced.css");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
