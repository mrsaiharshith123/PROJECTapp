import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { SettingsGroup, SettingsGroupRow } from "../SettingsGroup.jsx";

const TOOL_ROWS = [
  { icon: "chart-line", labelKey: "you.tools.insights", path: "/money/insights", color: /** @type {const} */ ("teal") },
  { icon: "currency-inr", labelKey: "you.tools.tax", path: "/you/tools?tool=tax", color: /** @type {const} */ ("indigo") },
  { icon: "chart-line-down", labelKey: "you.tools.loan", path: "/you/tools?tool=loan", color: /** @type {const} */ ("teal") },
  { icon: "shield", labelKey: "you.tools.safety", path: "/you/tools?tool=safety", color: /** @type {const} */ ("teal") },
  { icon: "target", labelKey: "you.tools.retirement", path: "/you/tools?tool=retirement", color: /** @type {const} */ ("gold") },
];

/** Tools & calculators — moved from Plan tab to You. */
export default function ProfileToolsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <SettingsGroup title={t("you.tools.groupTitle")} icon="calculator">
      {TOOL_ROWS.map((row) => (
        <SettingsGroupRow
          key={row.labelKey}
          icon={row.icon}
          iconColor={row.color}
          label={t(row.labelKey)}
          onClick={() => navigate(row.path)}
        />
      ))}
      <SettingsGroupRow
        icon="wrench"
        iconColor="violet"
        label={t("you.tools.seeAll")}
        onClick={() => navigate("/you/tools")}
      />
    </SettingsGroup>
  );
}
