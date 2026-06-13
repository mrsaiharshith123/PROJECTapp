import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { PerovoLogo } from "../brand/PerovoLogo.jsx";
import { PerovoBrand } from "../brand/PerovoBrand.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { RouteSkeleton } from "./loadingSkeletons.jsx";

const LOADING_HINT_KEYS = [
  "common.loadingHint1",
  "common.loadingHint2",
  "common.loadingHint3",
  "common.loadingHint4",
];

/**
 * @param {{ className?: string, style?: import('react').CSSProperties }} props
 */
export function Skeleton({ className = "", style }) {
  return <div className={`ct-skeleton ${className}`.trim()} style={style} aria-hidden />;
}

/**
 * @param {{ size?: 'sm' | 'md' | 'lg' }} props
 */
export function LoadingSpinner({ size = "md" }) {
  return (
    <div className={`ct-spin ct-spin-${size}`} role="presentation" aria-hidden>
      <span className="ct-spin-ring" />
      <span className="ct-spin-core">
        <PerovoLogo size={size === "lg" ? 22 : size === "sm" ? 14 : 18} />
      </span>
    </div>
  );
}

function LoadingAmbient() {
  return (
    <div className="ct-load-ambient" aria-hidden>
      <div className="ct-load-grid" />
      <div className="ct-load-orb ct-load-orb-a" />
      <div className="ct-load-orb ct-load-orb-b" />
      <div className="ct-load-shine" />
    </div>
  );
}

function useRotatingHint(enabled = true) {
  const { t } = useTranslation();
  const hints = useMemo(() => LOADING_HINT_KEYS.map((key) => t(key)), [t]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || hints.length < 2) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % hints.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, [enabled, hints.length]);

  return hints[index] || hints[0];
}

/**
 * Full-screen boot loader — auth session, profile, initial app shell.
 * @param {{ message?: string, hint?: boolean }} props
 */
export function PageLoader({ message, hint = true }) {
  const { t } = useTranslation();
  const rotatingHint = useRotatingHint(hint && !message);
  const label = message || t("common.loadingApp");
  const sub = hint ? rotatingHint : null;

  return (
    <div className="ct-load-scene ct-load-scene-full" role="status" aria-live="polite" aria-busy="true">
      <LoadingAmbient />
      <div className="ct-load-center">
        <div className="ct-load-brand">
          <PerovoBrand layout="column" iconSize="lg" wordmarkSize="md" className="ct-load-brand-lockup" />
        </div>
        <LoadingSpinner size="lg" />
        <p className="ct-load-message">{label}</p>
        {sub && (
          <p key={sub} className="ct-load-hint">
            {sub}
          </p>
        )}
        <div className="ct-load-progress" aria-hidden>
          <span className="ct-load-progress-bar" />
        </div>
      </div>
    </div>
  );
}

/**
 * Route-aware Suspense fallback — skeleton matches the destination page.
 */
export function RouteFallback() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <div className="ct-route-load" role="status" aria-live="polite" aria-busy="true">
      <div className="ct-route-load-top" aria-hidden>
        <span className="ct-route-load-bar" />
        <div className="ct-route-load-pill">
          <LoadingSpinner size="sm" />
          <span>{t("common.loadingPage")}</span>
        </div>
      </div>
      <RouteSkeleton pathname={pathname} />
    </div>
  );
}

/**
 * Compact loader for sections (profile blocks, cards).
 * @param {{ message?: string }} props
 */
export function SectionLoader({ message }) {
  const { t } = useTranslation();
  return (
    <div className="ct-section-load" role="status" aria-live="polite" aria-busy="true">
      <LoadingSpinner size="md" />
      <p className="ct-section-load-text">{message || t("common.loading")}</p>
      <div className="ct-section-load-sk">
        <Skeleton className="ct-load-sk-line" />
        <Skeleton className="ct-load-sk-line-sm" />
        <Skeleton className="ct-load-sk-line" />
      </div>
    </div>
  );
}

/**
 * Inline row loader for tight spaces.
 * @param {{ label?: string }} props
 */
export function InlineLoader({ label }) {
  const { t } = useTranslation();
  return (
    <span className="ct-inline-load" role="status" aria-live="polite">
      <LoadingSpinner size="sm" />
      <span>{label || t("common.loading")}</span>
    </span>
  );
}
