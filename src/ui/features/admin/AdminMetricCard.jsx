import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "../../utils/cn.js";

const TONE_CLASS = {
  default: "indigo",
  positive: "teal",
  caution: "amber",
};

/**
 * @param {{ label: string, value: import('react').ReactNode, hint?: string, tone?: 'default' | 'positive' | 'caution', sparkline?: number[] }} props
 */
export default function AdminMetricCard({ label, value, hint, tone = "default", sparkline }) {
  const sparkData = useMemo(
    () => (sparkline || []).map((v, i) => ({ i, v: Number(v) || 0 })),
    [sparkline],
  );
  const showSpark = sparkData.length > 1;

  return (
    <div className={cn("ct-stat-tile", TONE_CLASS[tone] || "indigo")}>
      <p className="ct-stat-tile-label">{label}</p>
      <p className="ct-stat-tile-value ct-numeral">{value}</p>
      {showSpark ? (
        <div className="ct-admin-metric-spark mt-1.5" aria-hidden>
          <ResponsiveContainer width="100%" height={30}>
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke="var(--ct-accent)"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      {hint ? <p className="ct-stat-tile-label mt-1">{hint}</p> : null}
    </div>
  );
}
