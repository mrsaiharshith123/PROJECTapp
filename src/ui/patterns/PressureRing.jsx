import { useCountUp } from "../hooks/useCountUp.js";

/**
 * Animated circular pressure score (0–100).
 * @param {{ score?: number, size?: number, strokeWidth?: number }} props
 */
export function PressureRing({ score = 0, size = 80, strokeWidth = 6 }) {
  const animated = useCountUp(score, 1000);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (animated / 100) * circ;

  const tone =
    score < 45 ? "#0d9488" : score < 70 ? "#d97706" : score < 80 ? "#ea580c" : "#dc2626";

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
            fontWeight: 800,
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
