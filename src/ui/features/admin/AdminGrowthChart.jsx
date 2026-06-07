import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartShell } from "../../patterns/ChartShell.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";

/**
 * @param {{ points: Array<{ date?: string, signups?: number }> }} props
 */
export default function AdminGrowthChart({ points = [] }) {
  const { t } = useTranslation();
  const data = points.map((p) => ({
    date: String(p.date || "").slice(5),
    signups: Number(p.signups) || 0,
  }));

  return (
    <ChartShell title={t("admin.chart.growth")} hint={t("admin.chart.growthHint")} compact height={200}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "var(--ct-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "var(--ct-text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--ct-surface)",
              border: "1px solid var(--ct-border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="signups" fill="var(--ct-accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
