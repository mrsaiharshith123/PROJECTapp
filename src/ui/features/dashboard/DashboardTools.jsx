import { useMemo, useState } from "react";
import { ToolTile } from "../ToolTile.jsx";
import { Modal } from "../../primitives/Modal.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import InsuranceCalculatorModal from "../modals/InsuranceCalculatorModal.jsx";
import { getToolsForMode, getDashboardToolsHeading, getExperienceMode } from "../../../constants/modeExperience.js";
import { TOOL_ICONS } from "../../../constants/symbols.js";
import ChitFundAdvisor from "../tools/ChitFundAdvisor.jsx";
import BondAdvisor from "../tools/BondAdvisor.jsx";
import MoneyPlannerPanel from "../tools/MoneyPlannerPanel.jsx";
import LoanToolsPanel from "../tools/LoanToolsPanel.jsx";
import IncomeTaxPanel from "../tools/IncomeTaxPanel.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { orderDashboardWidgets } from "../../../utils/dashboardToolOrder.js";

/** Calculator widgets + modals — embedded on Home dashboard. */
export default function DashboardTools() {
  const { commitments, settings, getEffectiveStatus, todayStr, updateSettings } = useCommitTrack();
  const toolMode = getExperienceMode(settings);
  const widgets = useMemo(() => {
    const defaultToolList = getToolsForMode(settings);
    return /** @type {{ id: string, title: string, subtitle?: string, accent?: string, icon?: string }[]} */ (
      orderDashboardWidgets(defaultToolList, settings.dashboardToolOrderByMode?.[toolMode]).map((t) => ({
        ...t,
        icon: TOOL_ICONS[t.id],
      }))
    );
  }, [settings, toolMode]);
  const toolsHeading = getDashboardToolsHeading(settings);
  const [activeTool, setActiveTool] = useState(null);
  const [reorderTools, setReorderTools] = useState(false);
  const income = combinedMonthlyIncome(settings);

  const closeTool = () => setActiveTool(null);

  const persistToolOrder = (orderedIds) => {
    const prev =
      settings.dashboardToolOrderByMode && typeof settings.dashboardToolOrderByMode === "object"
        ? { ...settings.dashboardToolOrderByMode }
        : {};
    prev[toolMode] = orderedIds;
    updateSettings({ dashboardToolOrderByMode: prev });
  };

  const moveTool = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= widgets.length || fromIndex === toIndex) return;
    const ids = widgets.map((w) => w.id);
    const [moved] = ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, moved);
    persistToolOrder(ids);
  };

  const resetToolOrder = () => {
    const prev =
      settings.dashboardToolOrderByMode && typeof settings.dashboardToolOrderByMode === "object"
        ? { ...settings.dashboardToolOrderByMode }
        : {};
    delete prev[toolMode];
    updateSettings({ dashboardToolOrderByMode: prev });
  };

  const modalTitle = widgets.find((w) => w.id === activeTool)?.title || "Tool";

  return (
    <section className="space-y-3" id="dashboard-tools">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="ct-h2 !text-base">{toolsHeading}</h2>
          <p className="ct-caption">
            {reorderTools
              ? "Use arrows to move tiles — order is saved for this mode."
              : "Tap a tile — similar tools are grouped so the grid stays simple."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {reorderTools && (
            <button
              type="button"
              className="text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              onClick={resetToolOrder}
            >
              Reset order
            </button>
          )}
          <button
            type="button"
            onClick={() => setReorderTools((v) => !v)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
              reorderTools
                ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-indigo-300"
            }`}
          >
            {reorderTools ? "Done" : "Reorder"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {widgets.map((t, i) =>
          reorderTools ? (
            <div key={t.id} className="flex gap-1.5 items-stretch min-h-[9.5rem]">
              <div className="flex flex-col justify-center gap-0.5 shrink-0 py-1">
                <button
                  type="button"
                  disabled={i === 0}
                  aria-label="Move up"
                  onClick={() => moveTool(i, i - 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === widgets.length - 1}
                  aria-label="Move down"
                  onClick={() => moveTool(i, i + 1)}
                  className="w-8 h-8 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  ↓
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <ToolTile icon={t.icon} title={t.title} subtitle={t.subtitle} accent={t.accent} onClick={() => {}} disabled />
              </div>
            </div>
          ) : (
            <ToolTile
              key={t.id}
              icon={t.icon}
              title={t.title}
              subtitle={t.subtitle}
              accent={t.accent}
              onClick={() => setActiveTool(t.id)}
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
        <Modal title="Chit timing advisor" onClose={closeTool}>
          <ChitFundAdvisor
            commitments={commitments}
            settings={settings}
            getEffectiveStatus={getEffectiveStatus}
            todayStr={todayStr}
          />
        </Modal>
      )}

      {activeTool === "bond" && (
        <Modal title="Bond return advisor" onClose={closeTool}>
          <BondAdvisor monthlyIncome={income} />
        </Modal>
      )}

      {activeTool === "incomeTax" && (
        <Modal title={modalTitle} onClose={closeTool}>
          <IncomeTaxPanel />
        </Modal>
      )}
    </section>
  );
}
