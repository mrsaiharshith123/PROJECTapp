import { PageShell, ToolsDiscoveryToast } from "../../";
import DashboardTools from "../dashboard/DashboardTools.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Plan tab — calculators, goals, and planning tools. */
export default function PlanPage() {
  const { t } = useTranslation();

  return (
    <PageShell title={t("nav.plan")} subtitle={t("plan.subtitle")}>
      <DashboardTools />
      <ToolsDiscoveryToast variant="home" />
    </PageShell>
  );
}
