import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** Quick tools entry on Home — compact row linking to calculators hub. */
export default function HomeToolsPreview() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section id="dashboard-tools" className="ct-home-tools-section">
      <button
        type="button"
        className="ct-pressable"
        onClick={() => navigate("/you/tools")}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "11px 14px",
          margin: "0 0 10px",
          cursor: "pointer",
          color: "inherit",
          fontFamily: "inherit",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span className="ct-icon-tile ct-icon-tile-sm instrument" aria-hidden>
            <CtIcon name="calculator" size={18} />
          </span>
          <span className="text-sm font-semibold">{t("home.tools.compactLink")}</span>
        </span>
        <CtIcon name="caret-right" size={16} className="text-[var(--ct-text-muted)] shrink-0" />
      </button>
    </section>
  );
}
