import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { dismissToolsNudge, isToolsNudgeDismissed } from "../../../utils/toolsDiscoveryStorage.js";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";

const SCROLL_IDLE_MS = 220;

export default function ToolsDiscoveryToast({ variant = "home" }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(() => isToolsNudgeDismissed());
  const [open, setOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (hidden) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [hidden]);

  useEffect(() => {
    if (hidden) return;
    let idleTimer;
    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => setScrolling(false), SCROLL_IDLE_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.clearTimeout(idleTimer);
    };
  }, [hidden]);

  const goToTools = () => {
    if (variant === "analytics") {
      navigate("/#dashboard-tools");
      return;
    }
    document.getElementById("dashboard-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dismiss = () => {
    dismissToolsNudge();
    setHidden(true);
    setOpen(false);
  };

  if (hidden) return null;

  const visible = open && !scrolling;

  return createPortal(
    <div
      className={`ct-tools-toast ${visible ? "ct-tools-toast-visible" : "ct-tools-toast-hidden"}`}
      aria-live="polite"
    >
      <div className="relative">
        <button type="button" onClick={goToTools} className="ct-tools-toast-btn">
          <span className="text-base leading-none shrink-0" aria-hidden>
            {"\u{1F9EE}"}
          </span>
          <div className="min-w-0">
            <Body className="!text-[11px] font-semibold leading-tight text-[var(--ct-text)]">
              {t("tools.calculators")}
            </Body>
            <Caption className="mt-0.5 block leading-snug">
              {variant === "analytics" ? t("tools.availableOnHome") : t("tools.plannerSubtitle")}
            </Caption>
            <Caption className="ct-text-accent font-semibold mt-1 block">
              {variant === "analytics" ? `${t("tools.openHome")} ↓` : `${t("tools.viewCalculatorsLink")} ↓`}
            </Caption>
          </div>
        </button>
        <button type="button" onClick={dismiss} className="ct-tools-toast-dismiss" aria-label={t("common.dismiss")}>
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}

export { ToolsDiscoveryToast };
