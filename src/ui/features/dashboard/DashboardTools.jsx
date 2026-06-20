import { useMemo, useState } from "react";
import { ToolTile } from "../ToolTile.jsx";
import { Modal } from "../../primitives/Modal.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import {
  getToolsForMode,
  getDashboardToolsHeadingKey,
  getToolTileKeys,
  getExperienceMode,
} from "../../../constants/modeExperience.js";
import { TOOL_ICONS } from "../../../constants/symbols.js";
import ChitFundAdvisor from "../tools/ChitFundAdvisor.jsx";
import BondAdvisor from "../tools/BondAdvisor.jsx";
import MoneyPlannerPanel from "../tools/MoneyPlannerPanel.jsx";
import LoanToolsPanel from "../tools/LoanToolsPanel.jsx";
import IncomeTaxPanel from "../tools/IncomeTaxPanel.jsx";
import RetirementPlannerPanel from "../tools/RetirementPlannerPanel.jsx";
import SafetyPlannerPanel from "../tools/SafetyPlannerPanel.jsx";
import FinancialAdvisorTool from "../tools/FinancialAdvisorTool.jsx";
import InsuranceCalculatorModal from "../modals/InsuranceCalculatorModal.jsx";
import InvestSavingsPanel from "../tools/InvestSavingsPanel.jsx";
import GoalsToolPanel from "../tools/GoalsToolPanel.jsx";
import AccountConnectTool from "../tools/AccountConnectTool.jsx";
import PayBillsTool from "../tools/PayBillsTool.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { orderDashboardWidgets } from "../../../utils/dashboardToolOrder.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useDragReorder } from "../../hooks/useDragReorder.js";

/** Calculator widgets + modals — embedded on Home dashboard. */
export default function DashboardTools() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus, todayStr, updateSettings } = usePerovo();
  const toolMode = getExperienceMode(settings);
  const widgets = useMemo(() => {
    const defaultToolList = getToolsForMode(settings);
    return orderDashboardWidgets(defaultToolList, settings.dashboardToolOrderByMode?.[toolMode]).map((tool) => {
      const keys = getToolTileKeys(tool.id, settings);
      return {
        id: tool.id,
        accent: String(tool.accent || "indigo"),
        icon: TOOL_ICONS[tool.id] || "calculator",
        title: t(keys.titleKey),
        subtitle: t(keys.subtitleKey),
      };
    });
  }, [settings, toolMode, t]);
  const toolsHeading = t(getDashboardToolsHeadingKey(settings));
  const [activeTool, setActiveTool] = useState(null);
  const [reorderTools, setReorderTools] = useState(false);
  const income = combinedMonthlyIncome(settings);

  const closeTool = () => setActiveTool(null);

  const widgetIds = useMemo(() => widgets.map((w) => w.id), [widgets]);

  const persistToolOrder = (orderedIds) => {
    const prev =
      settings.dashboardToolOrderByMode && typeof settings.dashboardToolOrderByMode === "object"
        ? { ...settings.dashboardToolOrderByMode }
        : {};
    prev[toolMode] = orderedIds;
    updateSettings({ dashboardToolOrderByMode: prev });
  };

  const { getDragProps } = useDragReorder(widgetIds, persistToolOrder);

  const resetToolOrder = () => {
    const prev =
      settings.dashboardToolOrderByMode && typeof settings.dashboardToolOrderByMode === "object"
        ? { ...settings.dashboardToolOrderByMode }
        : {};
    delete prev[toolMode];
    updateSettings({ dashboardToolOrderByMode: prev });
  };

  const modalTitle = widgets.find((w) => w.id === activeTool)?.title || t("tools.modalFallback");

  return (
    <section className="ct-stack-sm" id="dashboard-tools">
      <div className="ct-row-between" style={{ flexWrap: "wrap" }}>
        <div>
          <h2 className="ct-h2 !text-base">{toolsHeading}</h2>
          <p className="ct-caption">{reorderTools ? t("tools.reorderHint") : t("tools.tapTileHint")}</p>
        </div>
        <div className="ct-row shrink-0">
          {reorderTools && (
            <button type="button" className="ct-link !text-xs" onClick={resetToolOrder}>
              {t("tools.resetOrder")}
            </button>
          )}
          <button
            type="button"
            onClick={() => setReorderTools((v) => !v)}
            className={`ct-btn ct-btn-sm ${reorderTools ? "ct-btn-primary" : "ct-btn-outline"}`}
          >
            {reorderTools ? t("tools.doneReorder") : t("tools.reorder")}
          </button>
        </div>
      </div>
      <div className="ct-grid-3">
        {widgets.map((widget) =>
          reorderTools ? (
            <div
              key={widget.id}
              className="ct-drag-tile-wrap"
              {...getDragProps(widget.id, { enabled: true })}
            >
              <ToolTile
                icon={widget.icon}
                title={widget.title}
                subtitle={widget.subtitle}
                accent={widget.accent}
                onClick={() => {}}
                disabled
              />
            </div>
          ) : (
            <ToolTile
              key={widget.id}
              icon={widget.icon}
              title={widget.title}
              subtitle={widget.subtitle}
              accent={widget.accent}
              onClick={() => setActiveTool(widget.id)}
            />
          ),
        )}
      </div>

      {activeTool === "planner" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <MoneyPlannerPanel />
        </Modal>
      )}

      {activeTool === "loan" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <LoanToolsPanel />
        </Modal>
      )}

      {activeTool === "insurance" && (
        <InsuranceCalculatorModal
          commitments={commitments}
          todayStr={todayStr}
          monthlyIncome={income}
          onClose={closeTool}
        />
      )}

      {activeTool === "chit" && (
        <Modal title={t("tools.chit.title")} onClose={closeTool}>
          <ChitFundAdvisor
            commitments={commitments}
            settings={settings}
            getEffectiveStatus={getEffectiveStatus}
            todayStr={todayStr}
          />
        </Modal>
      )}

      {activeTool === "bond" && (
        <Modal title={t("tools.bond.title")} onClose={closeTool}>
          <BondAdvisor monthlyIncome={income} />
        </Modal>
      )}

      {activeTool === "incomeTax" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <IncomeTaxPanel />
        </Modal>
      )}

      {activeTool === "retirement" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <RetirementPlannerPanel />
        </Modal>
      )}

      {activeTool === "safety" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <SafetyPlannerPanel />
        </Modal>
      )}

      {activeTool === "advisor" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <FinancialAdvisorTool />
        </Modal>
      )}

      {activeTool === "invest" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <InvestSavingsPanel />
        </Modal>
      )}

      {activeTool === "goals" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <GoalsToolPanel />
        </Modal>
      )}

      {activeTool === "accountConnect" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <AccountConnectTool />
        </Modal>
      )}

      {activeTool === "payBills" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <PayBillsTool />
        </Modal>
      )}

    </section>
  );
}
