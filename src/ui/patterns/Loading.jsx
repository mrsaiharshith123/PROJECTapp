import { useEffect, useMemo, useState } from "react";
import { PerovoLogo } from "../brand/PerovoLogo.jsx";
import { useTranslationOptional } from "../../i18n/I18nProvider.js";

const LOADING_HINT_KEYS = [
  "common.loadingHint1",
  "common.loadingHint2",
  "common.loadingHint3",
  "common.loadingHint4",
];

/**
 * @param {{ className?: string, style?: import('react').CSSProperties, width?: string, height?: string, rounded?: string }} props
 */
export function Skeleton({ className = "", style, width, height = "1rem", rounded = "8px" }) {
  const merged = {
    width: width || style?.width || "100%",
    height: height || style?.height,
    borderRadius: rounded || style?.borderRadius,
    ...style,
  };
  return <div className={`ed-skeleton ${className}`.trim()} style={merged} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="ed-inset ed-stack" style={{ gap: "0.75rem" }}>
      <Skeleton width="40%" height="0.875rem" />
      <Skeleton width="70%" height="1.75rem" />
      <Skeleton width="100%" height="0.75rem" />
    </div>
  );
}

/**
 * @param {{ size?: 'sm' | 'md' | 'lg', showLogo?: boolean }} props
 */
export function LoadingSpinner({ size = "md", showLogo = false }) {
  return (
    <div className={`ed-spin ed-spin-${size}`} role="presentation" aria-hidden>
      <span className="ed-spin-ring" />
      {showLogo ? (
        <span className="ed-spin-core">
          <PerovoLogo size={size === "lg" ? 36 : size === "sm" ? 16 : 24} />
        </span>
      ) : null}
    </div>
  );
}

function useRotatingHint(enabled = true) {
  const { t } = useTranslationOptional();
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
  const { t } = useTranslationOptional();
  const rotatingHint = useRotatingHint(hint && !message);
  const sub = hint ? rotatingHint : null;

  return (
    <div className="ed-load-scene ed-load-scene-full" role="status" aria-live="polite" aria-busy="true">
      <div className="ed-load-center">
        <div className="ed-load-message-row">
          {message ? (
            <p className="ed-load-message ed-load-message-editorial">{message}</p>
          ) : (
            <div className="ed-load-brand-lockup">
              <p className="ed-load-brand-title">{t("brand.appName")}</p>
              <p className="ed-load-brand-tagline">{t("home.ed.tagline")}</p>
            </div>
          )}
        </div>
        {sub ? (
          <p key={sub} className="ed-load-hint">
            {sub}
          </p>
        ) : null}
        <div className="ed-load-progress" aria-hidden>
          <span className="ed-load-progress-bar" />
        </div>
      </div>
    </div>
  );
}

/**
 * Route-aware Suspense fallback — same boot loader as auth/session wait.
 */
export function RouteFallback() {
  return <PageLoader hint={false} />;
}

/**
 * Compact loader for sections (profile blocks, cards).
 * @param {{ message?: string }} props
 */
export function SectionLoader({ message }) {
  const { t } = useTranslationOptional();
  return (
    <div className="ed-section-load" role="status" aria-live="polite" aria-busy="true">
      <LoadingSpinner size="md" />
      <p className="ed-section-load-text">{message || t("common.loading")}</p>
      <div className="ed-section-load-sk">
        <Skeleton className="ed-load-sk-line" />
        <Skeleton className="ed-load-sk-line-sm" />
        <Skeleton className="ed-load-sk-line" />
      </div>
    </div>
  );
}

/**
 * Inline row loader for tight spaces.
 * @param {{ label?: string }} props
 */
export function InlineLoader({ label }) {
  const { t } = useTranslationOptional();
  return (
    <span className="ed-inline-load" role="status" aria-live="polite">
      <LoadingSpinner size="sm" />
      <span>{label || t("common.loading")}</span>
    </span>
  );
}
