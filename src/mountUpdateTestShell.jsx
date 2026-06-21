import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import UpdateTestShellApp from "./app/UpdateTestShellApp.jsx";

export function mountUpdateTestShell() {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;
  createRoot(rootEl).render(
    <StrictMode>
      <UpdateTestShellApp />
    </StrictMode>,
  );
}
