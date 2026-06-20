import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IS_DEV, getDevOverride, isForceShowAll } from "../../utils/devOverride.js";

export function DevFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [override, setOverride] = useState(() => (IS_DEV ? getDevOverride() : null));
  const [force, setForce] = useState(() => (IS_DEV ? isForceShowAll() : false));

  useEffect(() => {
    if (!IS_DEV) return undefined;
    const handler = () => {
      setOverride(getDevOverride());
      setForce(isForceShowAll());
    };
    window.addEventListener("perovo_dev_change", handler);
    return () => window.removeEventListener("perovo_dev_change", handler);
  }, []);

  if (!IS_DEV) return null;
  if (location.pathname === "/dev") return null;

  const hasOverride = Boolean(override) || force;

  return (
    <button
      type="button"
      onClick={() => navigate("/dev")}
      title="Open Dev Panel"
      className="ct-dev-fab"
      data-active={hasOverride ? "true" : "false"}
      aria-label="Open developer panel"
    >
      🔧
    </button>
  );
}
