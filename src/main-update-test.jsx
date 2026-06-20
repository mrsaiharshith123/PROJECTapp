import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/styles/update-test-minimal.css";
import UpdateTestShellApp from "./app/UpdateTestShellApp.jsx";
import { notifyNativeAppReady } from "./services/nativeOtaUpdate.js";

document.documentElement.dataset.ui = "ct";
document.documentElement.dataset.theme = "dark";
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <UpdateTestShellApp />
  </StrictMode>,
);

void notifyNativeAppReady();
