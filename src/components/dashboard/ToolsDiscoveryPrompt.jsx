import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "committrack_tools_nudge_dismissed";

export function isToolsNudgeDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissToolsNudge() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * Small toast on the right (Home + Analytics).
 * Tap → scroll to calculators on Home; from Analytics → navigate to Home.
 */
const SCROLL_IDLE_MS = 220;

export default function ToolsDiscoveryToast({ variant = "home" }) {
  const navigate = useNavigate();
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
      className={`fixed z-[55] right-3 max-w-[10.5rem] transition-all duration-300 ease-out bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-auto md:top-[4.75rem] ${
        visible ? "translate-x-0 opacity-100 scale-100" : "translate-x-4 opacity-0 scale-95 pointer-events-none"
      }`}
      aria-live="polite"
    >
      <div className="relative">
        <button
          type="button"
          onClick={goToTools}
          className="group w-full rounded-xl border border-violet-200/90 dark:border-violet-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg shadow-violet-500/10 p-2.5 pr-7 text-left hover:border-violet-300 dark:hover:border-violet-500 transition-colors"
        >
          <div className="flex items-start gap-2">
            <span className="text-base leading-none shrink-0" aria-hidden>
              {"\u{1F9EE}"}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                Better money math?
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
                {variant === "analytics" ? "Calculators on Home" : "Loan · debt · goals"}
              </p>
              <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 mt-1 group-hover:underline">
                {variant === "analytics" ? "Go there ↓" : "Show me ↓"}
              </p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 text-xs flex items-center justify-center"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>,
    document.body
  );
}
