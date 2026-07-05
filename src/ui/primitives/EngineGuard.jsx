import { Component } from "react";
import { useTranslationOptional } from "../../i18n/I18nProvider.js";
import { Caption } from "./Text.jsx";

function EngineGuardFallback() {
  const { t } = useTranslationOptional();
  return (
    <div className="ed-inset" style={{ textAlign: "center", padding: "20px 16px" }}>
      <Caption>{t("error.section.fallback")}</Caption>
    </div>
  );
}

/** Isolates engine-driven panels — one bad calculation must not crash the whole screen. */
export class EngineGuard extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (import.meta.env.DEV) {
      console.error("[EngineGuard]", error);
    }
  }

  render() {
    if (this.state.failed) return <EngineGuardFallback />;
    return this.props.children;
  }
}

export default EngineGuard;
