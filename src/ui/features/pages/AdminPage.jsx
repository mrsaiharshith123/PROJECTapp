import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminOverview } from "../../../hooks/useAdminOverview.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { exportAdminOverviewCsv, adminTimeAgo, moduleAdoptionPct } from "../../../utils/adminExport.js";
import { isRazorpayConfigured } from "../../../services/razorpayConfig.js";
import { Button, Caption, Heading, Body, AdminSkeleton } from "../../index.js";
import AdminMetricCard from "../admin/AdminMetricCard.jsx";
import AdminGrowthChart from "../admin/AdminGrowthChart.jsx";
import AdminUsersPanel from "../admin/AdminUsersPanel.jsx";

function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n}%` : "—";
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
}

function inr(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "—";
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

function churnTone(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "default";
  if (n < 30) return "positive";
  if (n < 60) return "caution";
  return "caution";
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, loading, error, refresh } = useAdminOverview();
  const isProd = import.meta.env.PROD;

  const totals = useMemo(
    () => /** @type {Record<string, unknown>} */ (data?.totals && typeof data.totals === "object" ? data.totals : {}),
    [data],
  );
  const retention = useMemo(
    () =>
      /** @type {Record<string, unknown>} */ (
        data?.retention && typeof data.retention === "object" ? data.retention : {}
      ),
    [data],
  );
  const growth = useMemo(() => (Array.isArray(data?.growth) ? data.growth : []), [data]);
  const modules = useMemo(() => (Array.isArray(data?.modules) ? data.modules : []), [data]);
  const onboarding = useMemo(() => (Array.isArray(data?.onboarding) ? data.onboarding : []), [data]);
  const recent = useMemo(() => (Array.isArray(data?.recent_signups) ? data.recent_signups : []), [data]);
  const totalUsers = Number(totals.users) || 0;

  const moduleRows = useMemo(
    () =>
      modules.map((m) => ({
        ...m,
        adoption_pct: moduleAdoptionPct(totalUsers, m.unique_users),
      })),
    [modules, totalUsers],
  );

  const growthSpark = useMemo(() => growth.map((g) => Number(g.signups) || 0), [growth]);
  const mrrSpark = useMemo(() => growth.map((g) => Number(g.mrr_inr) || 0), [growth]);

  const integrations = [
    { label: "Razorpay", ok: isRazorpayConfigured(), note: isRazorpayConfigured() ? t("admin.system.connected") : t("admin.system.notConfigured") },
    { label: "Sentry", ok: Boolean(import.meta.env.VITE_SENTRY_DSN), note: import.meta.env.VITE_SENTRY_DSN ? t("admin.system.connected") : t("admin.system.notConfigured") },
    { label: "Firebase FCM", ok: Boolean(import.meta.env.VITE_FIREBASE_API_KEY), note: import.meta.env.VITE_FIREBASE_API_KEY ? t("admin.system.connected") : t("admin.system.notConfigured") },
  ];

  if (loading && !data) {
    return (
      <div className="ct-page ct-admin-page">
        <AdminSkeleton />
      </div>
    );
  }

  if (error === "NOT_ADMIN") {
    return (
      <div className="ct-page ct-admin-page">
        <Body>{t("admin.denied")}</Body>
        <Button type="button" variant="outline" className="mt-4" onClick={() => navigate("/")}>
          {t("admin.backHome")}
        </Button>
      </div>
    );
  }

  return (
    <div className="ct-page ct-admin-page">
      <div className="ct-admin-command-bar">
        <div className="ct-admin-brand">
          <span className="ct-admin-title">{t("admin.commandTitle")}</span>
          <span className="ct-admin-env-badge">{isProd ? "PROD" : "DEV"}</span>
        </div>
        <span className="ct-admin-refresh-time">
          {t("admin.commandUpdated", { time: adminTimeAgo(String(data?.fetched_at || "")) })}
        </span>
        <div className="ct-admin-bar-actions">
          <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={() => exportAdminOverviewCsv(data)}>
            {t("admin.exportCsv")}
          </Button>
          <Button type="button" variant="outline" size="sm" className="!w-auto" onClick={refresh} disabled={loading}>
            {loading ? t("admin.refreshing") : t("admin.refresh")}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={() => navigate("/profile")}>
            {t("admin.backApp")}
          </Button>
        </div>
      </div>

      <div className="ct-admin-kpi-strip">
        <AdminMetricCard label={t("admin.metric.users")} value={loading ? "…" : num(totals.users)} sparkline={growthSpark} />
        <AdminMetricCard label={t("admin.metric.dau")} value={loading ? "…" : num(totals.dau)} />
        <AdminMetricCard label={t("admin.section.revenue")} value={loading ? "…" : inr(totals.mrr_inr)} tone="positive" sparkline={mrrSpark} />
        <AdminMetricCard label={t("admin.metric.active30")} value={loading ? "…" : num(totals.active_30d)} />
      </div>

      {error && error !== "NOT_ADMIN" ? <Body className="ct-admin-error">{error}</Body> : null}

      <section className="ct-admin-section">
        <Heading level={3}>{t("admin.section.revenue")}</Heading>
        <div className="ct-admin-metrics-grid">
          <AdminMetricCard label={t("admin.metric.mrr")} value={loading ? "…" : inr(totals.mrr_inr)} sparkline={mrrSpark} />
          <AdminMetricCard label={t("admin.metric.arr")} value={loading ? "…" : inr(totals.arr_inr)} />
          <AdminMetricCard label={t("admin.metric.conversion")} value={loading ? "…" : pct(totals.conversion_rate)} tone="positive" />
          <AdminMetricCard label={t("admin.metric.arpu")} value={loading ? "…" : inr(totals.arpu_inr)} />
        </div>
      </section>

      <section className="ct-admin-section ct-admin-two-col">
        <AdminGrowthChart points={growth} />
        <div className="ct-admin-panel">
          <Heading level={4}>{t("admin.section.retention")}</Heading>
          <div className="ct-admin-metrics-grid ct-admin-metrics-compact">
            <AdminMetricCard label={t("admin.retention.d1")} value={loading ? "…" : pct(retention.d1_pct)} />
            <AdminMetricCard label={t("admin.retention.d7")} value={loading ? "…" : pct(retention.d7_pct)} />
            <AdminMetricCard label={t("admin.retention.d30")} value={loading ? "…" : pct(retention.d30_pct)} />
          </div>
        </div>
      </section>

      <section className="ct-admin-section">
        <Heading level={3}>{t("admin.section.adoption")}</Heading>
        <div className="ct-admin-panel">
          {moduleRows.length === 0 ? (
            <Caption>{t("admin.empty.modules")}</Caption>
          ) : (
            <table className="ct-admin-table">
              <thead>
                <tr>
                  <th>{t("admin.adoption.feature")}</th>
                  <th>{t("admin.adoption.users")}</th>
                  <th>%</th>
                  <th aria-hidden />
                </tr>
              </thead>
              <tbody>
                {moduleRows
                  .slice()
                  .sort((a, b) => (b.adoption_pct || 0) - (a.adoption_pct || 0))
                  .map((m) => (
                    <tr key={String(m.module)}>
                      <td>{String(m.module)}</td>
                      <td>{num(m.unique_users)}</td>
                      <td>{pct(m.adoption_pct)}</td>
                      <td style={{ width: 120 }}>
                        <div className="ct-admin-adoption-bar">
                          <div className="ct-admin-adoption-fill" style={{ width: `${m.adoption_pct || 0}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="ct-admin-section ct-admin-two-col">
        <div className="ct-admin-panel">
          <Heading level={4}>{t("admin.section.health")}</Heading>
          <AdminMetricCard
            label={t("admin.metric.churnRisk")}
            value={loading ? "…" : num(retention.churn_risk_score)}
            tone={churnTone(retention.churn_risk_score)}
          />
          <AdminMetricCard label={t("admin.metric.inactive14")} value={loading ? "…" : num(totals.inactive_14d)} tone="caution" />
        </div>
        <div className="ct-admin-panel">
          <Heading level={4}>{t("admin.section.atRisk")}</Heading>
          {recent.filter((u) => Number(u.days_inactive) >= 14).length === 0 ? (
            <Caption>{t("admin.empty.atRisk")}</Caption>
          ) : (
            recent
              .filter((u) => Number(u.days_inactive) >= 14)
              .slice(0, 5)
              .map((u) => (
                <div key={String(u.id)} className="ct-admin-user-row">
                  <span>{String(u.display_name || "User")}</span>
                  <span className="ct-admin-muted">{t("admin.atRisk.inactive", { days: u.days_inactive })}</span>
                  <span className="ct-admin-tier">{String(u.subscription_tier || "free")}</span>
                </div>
              ))
          )}
        </div>
      </section>

      <section className="ct-admin-section ct-admin-two-col">
        <div className="ct-admin-panel">
          <Heading level={4}>{t("admin.section.distribution")}</Heading>
          <Caption className="block">{t("admin.metric.premium")}: {num(totals.premium_users)}</Caption>
          <Caption className="block mt-1">{t("admin.metric.sync")}: {num(totals.sync_users)}</Caption>
        </div>
        <div className="ct-admin-panel">
          <Heading level={4}>{t("admin.section.onboarding")}</Heading>
          {onboarding.length === 0 ? (
            <Caption>{t("admin.empty.onboarding")}</Caption>
          ) : (
            <ul className="ct-admin-list">
              {onboarding.map((o) => (
                <li key={String(o.step)} className="ct-admin-list-row">
                  <span className="ct-admin-list-label">{t("admin.onboarding.step", { step: o.step })}</span>
                  <span className="ct-admin-list-value">{num(o.count)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="ct-admin-section">
        <Heading level={3}>{t("admin.section.system")}</Heading>
        <div className="ct-admin-metrics-grid">
          {integrations.map((row) => (
            <div key={row.label} className="ct-admin-panel ct-admin-system-row">
              <span className={`ct-admin-status-dot${row.ok ? " ok" : ""}`} aria-hidden />
              <Body className="!text-sm">{row.label}</Body>
              <Caption className="block opacity-80">{row.note}</Caption>
            </div>
          ))}
        </div>
      </section>

      <section className="ct-admin-section">
        <AdminUsersPanel />
      </section>

      <section className="ct-admin-section">
        <Heading level={4}>{t("admin.section.recent")}</Heading>
        {recent.length === 0 ? (
          <Caption>{t("admin.empty.recent")}</Caption>
        ) : (
          <ul className="ct-admin-list">
            {recent.map((u) => (
              <li key={String(u.id)} className="ct-admin-list-row">
                <span className="ct-admin-list-label">{String(u.display_name || "User")}</span>
                <span className="ct-admin-list-value">{formatWhen(u.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Caption className="block text-center pb-4">{t("admin.footer")}</Caption>
    </div>
  );
}
