import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { bootstrapThemeFromStorage } from "./utils/theme.js";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

bootstrapThemeFromStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
