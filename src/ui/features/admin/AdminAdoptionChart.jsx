import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ moduleRows: Array<{ module?: string, adoption_pct?: number }> }} props
 */
export default function AdminAdoptionChart({ moduleRows }) {
  const { t } = useTranslation();
  const sorted = [...(moduleRows || [])]
    .sort((a, b) => (b.adoption_pct || 0) - (a.adoption_pct || 0))
    .slice(0, 12);

  return (
    <div className="ed-admin-chart-panel">
      <p className="ed-admin-panel-title">{t("admin.section.adoption")}</p>
      {sorted.length === 0 ? (
        <p className="ed-admin-chart-hint">{t("admin.empty.modules")}</p>
      ) : (
        <div className="ed-admin-adoption-list">
          {sorted.map((m) => (
            <div key={String(m.module)} className="ed-admin-adoption-row">
              <span className="ed-admin-adoption-label">{String(m.module).replace(/_/g, " ")}</span>
              <div className="ed-admin-adoption-bar-wrap">
                <div
                  className="ed-admin-adoption-fill"
                  style={{ width: `${Math.min(100, m.adoption_pct || 0)}%` }}
                />
              </div>
              <span className="ed-admin-adoption-pct">{Math.round(m.adoption_pct || 0)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
