import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { ToolTile } from "../ToolTile.jsx";

const PREVIEW_TOOLS = [
  { id: "tax",     icon: "currency-inr",   accent: "indigo", titleKey: "plan.tools.tax" },
  { id: "loan",    icon: "chart-line-down", accent: "teal",   titleKey: "plan.tools.loanPayoff" },
  { id: "safety",  icon: "shield",         accent: "teal",   titleKey: "plan.tools.safety" },
];

/** Quick tools preview on Home — 3 tiles + "See all" link. */
export default function HomeToolsPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section id="dashboard-tools" className="ct-home-tools-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p className="ct-analytics-section-title">{t("home.tools.sectionTitle")}</p>
        <button
          type="button"
          className="ct-btn ct-btn-ghost ct-btn-sm"
          onClick={() => navigate("/you/tools")}
          style={{ fontSize: 11 }}
        >
          {t("home.tools.seeAll")}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {PREVIEW_TOOLS.map((tool) => (
          <ToolTile
            key={tool.id}
            icon={tool.icon}
            title={t(tool.titleKey)}
            accent={tool.accent}
            onClick={() => navigate(`/you/tools?tool=${tool.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
