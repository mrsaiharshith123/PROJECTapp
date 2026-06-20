import { useCountUp } from "../hooks/useCountUp.js";

/** @param {number | null | undefined} score @param {'pressure' | 'perovo'} mode */
function scoreRingFillColor(score, mode = "pressure") {
  if (score == null) return "#6e6c8a";
  if (mode === "perovo") {
    if (score >= 70) return "#2dd4bf";
    if (score >= 40) return "#fbbf24";
    return "#f87171";
  }
  if (score < 45) return "#2dd4bf";
  if (score < 70) return "#fbbf24";
  if (score < 80) return "#fb923c";
  return "#f87171";
}

/**
 * Circular score ring — pressure (lower is better) or Perovo Score (higher is better).
 * @param {{ score?: number, size?: number, strokeWidth?: number, variant?: 'stroke' | 'conic', tierLabel?: string, scoreMode?: 'pressure' | 'perovo', ariaLabel?: string }} props
 */
export function PressureRing({
  score = 0,
  size = 80,
  strokeWidth = 6,
  variant = "stroke",
  tierLabel,
  scoreMode = "pressure",
  ariaLabel,
}) {
  const animated = useCountUp(score, 1000);
  const tone = scoreRingFillColor(score, scoreMode);

  if (variant === "conic") {
    const outer = size;
    const inner = Math.round(size * 0.78);
    const fillRatio = scoreMode === "perovo" ? animated / 100 : (100 - animated) / 100;
    const filledDeg = Math.max(0, Math.min(360, fillRatio * 360));
    const conic = `conic-gradient(${tone} 0deg ${filledDeg}deg, rgba(255,255,255,0.08) ${filledDeg}deg 360deg)`;

    return (
      <div
        className="ct-conic-ring"
        style={{ width: outer, height: outer, background: conic }}
        role="img"
        aria-label={ariaLabel}
      >
        <div
          className="ct-conic-ring-inner"
          style={{ width: inner, height: inner }}
        >
          <span
            className="ct-hero-number"
            style={{ fontSize: size * 0.28, color: tone, marginTop: 0 }}
          >
            {animated}
          </span>
          {tierLabel ? (
            <span
              style={{
                fontSize: 9,
                color: tone,
                fontWeight: 600,
                marginTop: 2,
                textAlign: "center",
                lineHeight: 1.15,
                maxWidth: inner * 0.85,
              }}
            >
              {tierLabel}
            </span>
          ) : (
            <span style={{ fontSize: 9, color: "var(--ct-text-muted)", fontWeight: 500, marginTop: 2 }}>
              /100
            </span>
          )}
        </div>
      </div>
    );
  }

  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.05s linear, stroke 0.3s" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--ct-font-display)",
            fontSize: `${size * 0.22}px`,
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: tone,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {animated}
        </span>
        <span
          style={{
            fontSize: `${size * 0.115}px`,
            color: "var(--ct-text-muted)",
            fontWeight: 500,
          }}
        >
          /100
        </span>
      </div>
    </div>
  );
}

export default PressureRing;
