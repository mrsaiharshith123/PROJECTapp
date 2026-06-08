import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminOverview } from "../../../hooks/useAdminOverview.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Button, Caption, Eyebrow, Heading, Body } from "../../index.js";
import AdminMetricCard from "../admin/AdminMetricCard.jsx";
import AdminGrowthChart from "../admin/AdminGrowthChart.jsx";

function pct(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${n}%` : "—";
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("en-IN") : "—";
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, loading, error, refresh } = useAdminOverview();

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
      <div className="ct-admin-head">
        <div>
          <Eyebrow>{t("admin.eyebrow")}</Eyebrow>
          <Heading level={2}>{t("admin.title")}</Heading>
          <Caption className="block mt-1">{t("admin.subtitle")}</Caption>
        </div>
        <div className="ct-row shrink-0">
          <Button type="button" variant="ghost" size="sm" className="!w-auto" onClick={() => navigate("/")}>
            {t("admin.backHome")}
          </Button>
          <Button type="button" variant="outline" size="sm" className="!w-auto" onClick={refresh} disabled={loading}>
            {loading ? t("admin.refreshing") : t("admin.refresh")}
          </Button>
        </div>
      </div>

      {error && error !== "NOT_ADMIN" && <Body className="ct-admin-error">{error}</Body>}

      <section className="ct-admin-section">
        <Heading level={3}>{t("admin.section.overview")}</Heading>
        <div className="ct-admin-metrics-grid">
          <AdminMetricCard label={t("admin.metric.users")} value={loading ? "…" : num(totals.users)} />
          <AdminMetricCard label={t("admin.metric.dau")} value={loading ? "…" : num(totals.dau)} />
          <AdminMetricCard label={t("admin.metric.wau")} value={loading ? "…" : num(totals.wau)} />
          <AdminMetricCard label={t("admin.metric.mau")} value={loading ? "…" : num(totals.mau)} />
          <AdminMetricCard
            label={t("admin.metric.onboarding")}
            value={loading ? "…" : pct(totals.onboarding_rate)}
            hint={loading ? undefined : `${num(totals.onboarding_complete)} complete`}
            tone="positive"
          />
          <AdminMetricCard label={t("admin.metric.premium")} value={loading ? "…" : num(totals.premium_users)} />
          <AdminMetricCard label={t("admin.metric.sync")} value={loading ? "…" : num(totals.sync_users)} />
          <AdminMetricCard label={t("admin.metric.active30")} value={loading ? "…" : num(totals.active_30d)} />
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
          <Caption className="block mt-3">{t("admin.retention.hint")}</Caption>
        </div>
      </section>

      <section className="ct-admin-section ct-admin-two-col">
        <div className="ct-admin-panel">
          <Heading level={4}>{t("admin.section.modules")}</Heading>
          {modules.length === 0 ? (
            <Caption>{t("admin.empty.modules")}</Caption>
          ) : (
            <ul className="ct-admin-list">
              {modules.map((m) => (
                <li key={String(m.module)} className="ct-admin-list-row">
                  <span className="ct-admin-list-label">{String(m.module)}</span>
                  <span className="ct-admin-list-value">
                    {num(m.opens)} · {num(m.unique_users)} users
                  </span>
                </li>
              ))}
            </ul>
          )}
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
        <Heading level={4}>{t("admin.section.recent")}</Heading>
        {recent.length === 0 ? (
          <Caption>{t("admin.empty.recent")}</Caption>
        ) : (
          <ul className="ct-admin-list">
            {recent.map((u) => (
              <li key={String(u.id)} className="ct-admin-list-row">
                <span className="ct-admin-list-label">{String(u.display_name || "User")}</span>
                <span className="ct-admin-list-value">
                  {formatWhen(u.created_at)}
                  {u.onboarding_complete ? ` · ${t("admin.onboarding.done")}` : ` · ${t("admin.onboarding.pending")}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Caption className="block text-center pb-4">{t("admin.footer")}</Caption>
    </div>
  );
}
