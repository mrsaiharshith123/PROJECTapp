import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminOverview } from "../../../hooks/useAdminOverview.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { exportAdminOverviewCsv, adminTimeAgo, moduleAdoptionPct } from "../../../utils/adminExport.js";
import { isRazorpayConfigured } from "../../../services/razorpayConfig.js";
import { Body, AdminSkeleton } from "../../index.js";
import AdminMetricCard from "../admin/AdminMetricCard.jsx";
import AdminGrowthChart from "../admin/AdminGrowthChart.jsx";
import AdminMrrChart from "../admin/AdminMrrChart.jsx";
import AdminRetentionChart from "../admin/AdminRetentionChart.jsx";
import AdminAdoptionChart from "../admin/AdminAdoptionChart.jsx";
import AdminUsersPanel from "../admin/AdminUsersPanel.jsx";
import AdminBroadcastComposer from "../admin/AdminBroadcastComposer.jsx";

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

function churnTone(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "default";
  if (n < 30) return "green";
  if (n < 60) return "amber";
  return "red";
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
    {
      label: "Razorpay",
      ok: isRazorpayConfigured(),
      note: isRazorpayConfigured() ? t("admin.system.connected") : t("admin.system.notConfigured"),
    },
    {
      label: "Sentry",
      ok: Boolean(import.meta.env.VITE_SENTRY_DSN),
      note: import.meta.env.VITE_SENTRY_DSN ? t("admin.system.connected") : t("admin.system.notConfigured"),
    },
  ];

  if (loading && !data) {
    return (
      <div className="ed-admin-page">
        <AdminSkeleton />
      </div>
    );
  }

  if (error === "NOT_ADMIN") {
    return (
      <div className="ed-admin-page" style={{ padding: "var(--ed-page-x)" }}>
        <Body>{t("admin.denied")}</Body>
        <button type="button" className="ed-btn ed-btn-secondary mt-4" onClick={() => navigate("/")}>
          {t("admin.backHome")}
        </button>
      </div>
    );
  }

  return (
    <div className="ed-admin-page">
      <div className="ed-admin-command-bar">
        <div className="ed-admin-command-left">
          <span className="ed-admin-title">{t("admin.commandTitle")}</span>
          <span className={`ed-admin-env-badge${isProd ? " prod" : ""}`}>{isProd ? "PROD" : "DEV"}</span>
        </div>
        <span className="ed-admin-updated">
          {t("admin.commandUpdated", { time: adminTimeAgo(String(data?.fetched_at || "")) })}
        </span>
        <div className="ed-admin-command-actions">
          <button type="button" className="ed-btn ed-btn-ghost ed-btn-sm" onClick={() => exportAdminOverviewCsv(data)}>
            {t("admin.exportCsv")}
          </button>
          <button type="button" className="ed-btn ed-btn-secondary ed-btn-sm" onClick={refresh} disabled={loading}>
            {loading ? t("admin.refreshing") : t("admin.refresh")}
          </button>
          <button type="button" className="ed-btn ed-btn-ghost ed-btn-sm" onClick={() => navigate("/profile")}>
            {t("admin.backApp")}
          </button>
        </div>
      </div>

      <div className="ed-admin-kpi-strip">
        <AdminMetricCard label={t("admin.metric.users")} value={loading ? "…" : num(totals.users)} sparkline={growthSpark} />
        <AdminMetricCard label={t("admin.metric.dau")} value={loading ? "…" : num(totals.dau)} />
        <AdminMetricCard
          label={t("admin.metric.mrr")}
          value={loading ? "…" : inr(totals.mrr_inr)}
          sparkline={mrrSpark}
          tone="green"
        />
        <AdminMetricCard label={t("admin.metric.active30")} value={loading ? "…" : num(totals.active_30d)} />
      </div>

      {error && error !== "NOT_ADMIN" ? (
        <p className="ed-admin-error" style={{ padding: "12px var(--ed-page-x)" }}>
          {error}
        </p>
      ) : null}

      <section className="ed-admin-section">
        <p className="ed-admin-section-title">{t("admin.section.revenue")}</p>
        <div className="ed-admin-kpi-strip">
          <AdminMetricCard
            label={t("admin.metric.mrr")}
            value={loading ? "…" : inr(totals.mrr_inr)}
            sparkline={mrrSpark}
            tone="green"
          />
          <AdminMetricCard label={t("admin.metric.arr")} value={loading ? "…" : inr(totals.arr_inr)} />
          <AdminMetricCard
            label={t("admin.metric.conversion")}
            value={loading ? "…" : pct(totals.conversion_rate)}
            tone="green"
          />
          <AdminMetricCard label={t("admin.metric.arpu")} value={loading ? "…" : inr(totals.arpu_inr)} wide />
        </div>
      </section>

      <section className="ed-admin-section">
        <div className="ed-admin-charts-row">
          <AdminGrowthChart points={growth} />
          <AdminMrrChart points={growth} />
        </div>
      </section>

      <section className="ed-admin-section">
        <AdminRetentionChart retention={retention} />
      </section>

      <section className="ed-admin-section">
        <AdminAdoptionChart moduleRows={moduleRows} />
      </section>

      <section className="ed-admin-section">
        <div className="ed-admin-two-col">
          <div className="ed-admin-panel">
            <p className="ed-admin-panel-title">{t("admin.section.health")}</p>
            <AdminMetricCard
              label={t("admin.metric.churnRisk")}
              value={loading ? "…" : num(retention.churn_risk_score)}
              tone={churnTone(retention.churn_risk_score)}
            />
            <AdminMetricCard
              label={t("admin.metric.inactive14")}
              value={loading ? "…" : num(totals.inactive_14d)}
              tone="amber"
            />
            <AdminMetricCard label={t("admin.metric.premium")} value={loading ? "…" : num(totals.premium_users)} />
            <AdminMetricCard label={t("admin.metric.sync")} value={loading ? "…" : num(totals.sync_users)} />
          </div>
          <div className="ed-admin-panel">
            <p className="ed-admin-panel-title">{t("admin.section.onboarding")}</p>
            {onboarding.length === 0 ? (
              <p className="ed-admin-chart-hint">{t("admin.empty.onboarding")}</p>
            ) : (
              onboarding.map((o) => (
                <div key={String(o.step)} className="ed-admin-funnel-row">
                  <span className="ed-admin-funnel-label">{t("admin.onboarding.step", { step: o.step })}</span>
                  <span className="ed-admin-funnel-value" style={{ color: "var(--ed-gold)" }}>
                    {num(o.count)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="ed-admin-section">
        <p className="ed-admin-section-title">{t("admin.broadcasts.title")}</p>
        <AdminBroadcastComposer />
      </section>

      <section className="ed-admin-section">
        <p className="ed-admin-section-title">{t("admin.section.system")}</p>
        <div className="ed-admin-system-grid">
          {integrations.map((row) => (
            <div key={row.label} className="ed-admin-system-row">
              <span className={`ed-admin-status-dot${row.ok ? " ok" : ""}`} aria-hidden />
              <span className="ed-admin-system-label">{row.label}</span>
              <span className="ed-admin-system-note">{row.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="ed-admin-section">
        <AdminUsersPanel />
      </section>

      <p className="ed-admin-footer">
        {t("admin.footer")} · {isProd ? t("admin.envProd") : t("admin.envDev")}
      </p>
    </div>
  );
}
