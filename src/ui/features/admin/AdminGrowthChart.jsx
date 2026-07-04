import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ active?: boolean, payload?: Array<{ value?: number }>, label?: string }} props
 */
function AdminTooltip({ active, payload, label }) {
  const { t } = useTranslation();
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
      <p style={{ fontWeight: 600 }}>
        {t("admin.chart.signupsCount", { count: payload[0].value ?? 0 })}
      </p>
    </div>
  );
}

/**
 * @param {{ points: Array<{ date?: string, signups?: number, mrr_inr?: number }> }} props
 */
export default function AdminGrowthChart({ points = [] }) {
  const { t } = useTranslation();
  const data = points.map((p) => ({
    date: String(p.date || "").slice(5),
    signups: Number(p.signups) || 0,
    mrr: Number(p.mrr_inr) || 0,
  }));

  return (
    <div className="ed-admin-chart-panel">
      <p className="ed-admin-panel-title">{t("admin.chart.growth")}</p>
      <p className="ed-admin-chart-hint">{t("admin.chart.growthHint")}</p>
      <div style={{ height: 160, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="var(--ed-rule-soft)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--ed-ink-faint)", fontSize: 9, fontFamily: "Inter, sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--ed-ink-faint)", fontSize: 9, fontFamily: "Inter, sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<AdminTooltip />} cursor={{ fill: "var(--ed-surface-2)" }} />
            <Bar dataKey="signups" fill="var(--ed-gold)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
