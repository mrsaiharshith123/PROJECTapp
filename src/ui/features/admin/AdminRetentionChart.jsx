import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ retention?: { d1_pct?: number, d7_pct?: number, d30_pct?: number } }} props
 */
export default function AdminRetentionChart({ retention }) {
  const { t } = useTranslation();
  const data = [
    { label: t("admin.retention.d1"), value: Number(retention?.d1_pct) || 0 },
    { label: t("admin.retention.d7"), value: Number(retention?.d7_pct) || 0 },
    { label: t("admin.retention.d30"), value: Number(retention?.d30_pct) || 0 },
  ];

  return (
    <div className="ed-admin-chart-panel">
      <p className="ed-admin-panel-title">{t("admin.section.retention")}</p>
      <div style={{ height: 120, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--ed-ink-faint)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "var(--ed-ink-faint)", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`${v}%`, t("admin.chart.retentionLabel")]}
              contentStyle={{
                background: "var(--ed-surface)",
                border: "0.5px solid var(--ed-rule)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((d) => (
                <Cell
                  key={d.label}
                  fill={
                    d.value > 60 ? "var(--ed-green)" : d.value > 30 ? "var(--ed-gold)" : "var(--ed-amber)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
