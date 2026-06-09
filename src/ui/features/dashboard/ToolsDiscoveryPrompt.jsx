import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { dismissToolsNudge, isToolsNudgeDismissed } from "../../../utils/toolsDiscoveryStorage.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
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

export default function ToolsDiscoveryToast({ variant = "home", blocked = false }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(() => isToolsNudgeDismissed());
  const [ready, setReady] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [toolsReached, setToolsReached] = useState(false);

  useEffect(() => {
    if (dismissed || blocked) return;
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [dismissed, blocked]);

  useEffect(() => {
    if (dismissed || blocked || variant !== "home") return;

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
  }, [dismissed, blocked, variant]);

  useEffect(() => {
    if (dismissed || blocked || variant !== "analytics") return;

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
  }, [dismissed, blocked, variant]);

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

  if (dismissed) return null;

  const visible =
    ready && !blocked && !scrolling && (variant === "analytics" || !toolsReached);

  return createPortal(
    <div
      className={`ct-tools-toast ${visible ? "ct-tools-toast-visible" : "ct-tools-toast-hidden"}`}
      aria-live="polite"
      role="complementary"
    >
      <div className="relative">
        <button type="button" onClick={goToTools} className="ct-tools-toast-btn">
          <span className="ct-tools-toast-icon shrink-0" aria-hidden>
            <CtIcon name="calculator" size={22} />
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
    document.body,
  );
}

export { ToolsDiscoveryToast };
