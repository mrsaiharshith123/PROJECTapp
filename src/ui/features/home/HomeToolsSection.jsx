import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  HOME_CALCULATOR_TOOLS,
  HOME_GROWTH_TOOLS,
  homeToolPath,
} from "../../../constants/homeFeaturedTools.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

function ToolTileGrid({ tools, onOpen }) {
  const { t } = useTranslation();

  return (
    <div className="ed-tool-grid">
      {tools.map((tool) => (
        <button
          key={tool.id}
          type="button"
          className="ed-tool-tile"
          onClick={() => onOpen(tool.id)}
          aria-label={t(tool.titleKey)}
        >
          <span className="ed-tool-tile-ico">
            <CtIcon name={tool.icon} size={18} />
          </span>
          <span className="ed-tool-tile-name">{t(tool.titleKey)}</span>
          <span className="ed-tool-tile-sub">{t(tool.subtitleKey)}</span>
        </button>
      ))}
    </div>
  );
}

/** Featured calculators & planners on Home — editorial tile grid + view all. */
export default function HomeToolsSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const openTool = (id) => navigate(homeToolPath(id));

  return (
    <section className="ed-home-tools">
      <div className="ed-tools-block ed-tools-block-head">
        <div className="ed-tools-section-head">{t("home.ed.toolsLabel")}</div>
      </div>

      <div className="ed-tools-block ed-tools-block-grid">
        <ToolTileGrid tools={HOME_CALCULATOR_TOOLS} onOpen={openTool} />
      </div>

      <div className="ed-tools-block">
        <div className="ed-tools-subhead">{t("plan.section.growthSub")}</div>
        <ToolTileGrid tools={HOME_GROWTH_TOOLS} onOpen={openTool} />
      </div>

      <button type="button" className="ed-tools-viewall" onClick={() => navigate("/you/tools")}>
        {t("home.tools.seeAll")}
      </button>
    </section>
  );
}
