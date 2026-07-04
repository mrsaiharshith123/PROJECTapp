import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

/**
 * @param {{
 *   label: string,
 *   value: import("react").ReactNode,
 *   hint?: string,
 *   tone?: "default" | "green" | "amber" | "red" | "positive" | "caution",
 *   sparkline?: number[],
 *   wide?: boolean,
 * }} props
 */
export default function AdminMetricCard({ label, value, hint, tone = "default", sparkline, wide = false }) {
  const sparkData = useMemo(
    () => (sparkline || []).map((v, i) => ({ i, v: Number(v) || 0 })),
    [sparkline],
  );
  const showSpark = sparkData.length > 1;
  const resolvedTone =
    tone === "positive" ? "green" : tone === "caution" ? "amber" : tone;
  const valueColor =
    resolvedTone === "green"
      ? "var(--ed-green)"
      : resolvedTone === "amber"
        ? "var(--ed-amber)"
        : resolvedTone === "red"
          ? "var(--ed-red)"
          : "var(--ed-ink)";

  return (
    <div className={`ed-admin-metric${wide ? " wide" : ""}`}>
      <p className="ed-admin-metric-label">{label}</p>
      <p className="ed-admin-metric-value" style={{ color: valueColor }}>
        {value}
      </p>
      {showSpark && (
        <div className="ed-admin-metric-spark" aria-hidden>
          <ResponsiveContainer width="100%" height={24}>
            <LineChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={valueColor === "var(--ed-ink)" ? "var(--ed-gold)" : valueColor}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {hint && <p className="ed-admin-metric-hint">{hint}</p>}
    </div>
  );
}
