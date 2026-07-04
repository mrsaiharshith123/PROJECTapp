import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ active?: boolean, payload?: Array<{ value?: number }>, label?: string }} props
 */
function AdminTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--ed-surface)",
        border: "0.5px solid var(--ed-rule)",
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
        color: "var(--ed-ink)",
      }}
    >
      <p style={{ color: "var(--ed-ink-faint)", fontSize: 10, marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 600 }}>₹{Number(payload[0].value).toLocaleString("en-IN")}</p>
    </div>
  );
}

/**
 * @param {{ points: Array<{ date?: string, mrr_inr?: number }> }} props
 */
export default function AdminMrrChart({ points = [] }) {
  const { t } = useTranslation();
  const data = points.map((p) => ({
    date: String(p.date || "").slice(5),
    mrr: Number(p.mrr_inr) || 0,
  }));

  return (
    <div className="ed-admin-chart-panel">
      <p className="ed-admin-panel-title">{t("admin.chart.mrr")}</p>
      <div style={{ height: 120, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ed-green)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--ed-green)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--ed-rule-soft)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--ed-ink-faint)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--ed-ink-faint)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<AdminTooltip />} />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="var(--ed-green)"
              strokeWidth={2}
              fill="url(#mrrGrad)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
