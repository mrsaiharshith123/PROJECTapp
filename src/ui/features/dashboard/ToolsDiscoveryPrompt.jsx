import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { dismissToolsNudge, isToolsNudgeDismissed } from "../../../utils/toolsDiscoveryStorage.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { FAB_CHANGE_EVENT } from "../../../constants/fabEvents.js";
import { Caption, Body } from "../../primitives/Text.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

const SHOW_DELAY_MS = 700;
const SCROLL_IDLE_MS = 220;

function isToolsSectionReached() {
  const el = document.getElementById("dashboard-tools");
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.55;
}

function ToolsDiscoveryCard({ variant, onGo, onDismiss, t }) {
  return (
    <div className="relative">
      <button type="button" onClick={onGo} className="ct-stat-tile teal ct-tools-discovery-tile ct-pressable w-full">
        <span className="ct-icon-tile ct-icon-tile-sm teal shrink-0" aria-hidden>
          <CtIcon name="calculator" size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <Body className="!text-[11px] font-semibold leading-tight">{t("tools.calculators")}</Body>
          <Caption className="mt-0.5 block leading-snug">
            {variant === "analytics" ? t("tools.availableOnHome") : t("home.tools.nudgeHint")}
          </Caption>
          <Caption className="ct-text-teal font-semibold mt-1 block">
            {variant === "analytics" ? `${t("tools.openHome")} ↓` : `${t("home.tools.nudgeCta")}`}
          </Caption>
        </div>
      </button>
      <button type="button" onClick={onDismiss} className="ct-tools-toast-dismiss" aria-label={t("common.dismiss")}>
        ×
      </button>
    </div>
  );
}

export default function ToolsDiscoveryToast({ variant = "home", blocked = false, inline = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => isToolsNudgeDismissed());
  const [ready, setReady] = useState(inline);
  const [scrolling, setScrolling] = useState(false);
  const [toolsReached, setToolsReached] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    const onFabChange = (e) => setFabOpen(Boolean(e.detail?.open));
    window.addEventListener(FAB_CHANGE_EVENT, onFabChange);
    return () => window.removeEventListener(FAB_CHANGE_EVENT, onFabChange);
  }, []);

  useEffect(() => {
    if (inline || dismissed || blocked) return;
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dismissed, blocked, inline]);

  useEffect(() => {
    if (inline || dismissed || blocked || variant !== "home") return;

    let scrollIdleTimer;
    let pollTimer;

    const updateToolsReached = () => {
      setToolsReached(isToolsSectionReached());
    };

    const onScroll = () => {
      setScrolling(true);
      updateToolsReached();
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => setScrolling(false), SCROLL_IDLE_MS);
    };

    updateToolsReached();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateToolsReached, { passive: true });

    let tries = 0;
    pollTimer = window.setInterval(() => {
      tries += 1;
      if (document.getElementById("dashboard-tools")) {
        updateToolsReached();
        window.clearInterval(pollTimer);
      } else if (tries >= 50) {
        window.clearInterval(pollTimer);
      }
    }, 100);

    return () => {
      window.clearTimeout(scrollIdleTimer);
      window.clearInterval(pollTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateToolsReached);
    };
  }, [dismissed, blocked, variant, inline]);

  useEffect(() => {
    if (inline || dismissed || blocked || variant !== "analytics") return;

    let scrollIdleTimer;

    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(scrollIdleTimer);
      scrollIdleTimer = window.setTimeout(() => setScrolling(false), SCROLL_IDLE_MS);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(scrollIdleTimer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dismissed, blocked, variant, inline]);

  const goToTools = () => {
    if (variant === "analytics") {
      navigate("/#dashboard-tools");
      return;
    }
    document.getElementById("dashboard-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dismiss = () => {
    dismissToolsNudge();
    setDismissed(true);
  };

  if (dismissed || blocked) return null;

  if (inline) {
    return (
      <div className="ct-tools-discovery-inline" aria-live="polite" role="complementary">
        <ToolsDiscoveryCard variant={variant} onGo={goToTools} onDismiss={dismiss} t={t} />
      </div>
    );
  }

  const visible =
    ready && !blocked && !fabOpen && !scrolling && (variant === "analytics" || !toolsReached);

  return createPortal(
    <div
      className={`ct-tools-toast ${visible ? "ct-tools-toast-visible" : "ct-tools-toast-hidden"}`}
      aria-live="polite"
      role="complementary"
    >
      <ToolsDiscoveryCard variant={variant} onGo={goToTools} onDismiss={dismiss} t={t} />
    </div>,
    document.body,
  );
}

export { ToolsDiscoveryToast };
