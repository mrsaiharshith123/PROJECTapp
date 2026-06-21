import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { Caption, Body } from "../../primitives/Text.jsx";

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
    <div className={`ct-admin-metric ct-admin-metric-${tone}`}>
      <Caption className="block ct-admin-metric-label">{label}</Caption>
      <Body className="ct-admin-metric-value">{value}</Body>
      {showSpark ? (
        <div className="ct-admin-metric-spark" aria-hidden>
          <ResponsiveContainer width="100%" height={30}>
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : null}
      {hint ? <Caption className="block ct-admin-metric-hint">{hint}</Caption> : null}
    </div>
  );
}
