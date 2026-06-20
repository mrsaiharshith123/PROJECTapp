import { Navigate } from "react-router-dom";
import { usePerovo } from "../context/PerovoContext.jsx";
import { getUserModeConfig } from "../constants/userModes.js";

/**
 * Redirects when the current path is not allowed for the user's mode.
 */
export default function ModeRoute({ path, children }) {
  const { settings } = usePerovo();
  const cfg = getUserModeConfig(settings.userMode || "salaried");
  if (!cfg.navPaths.includes(path)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
