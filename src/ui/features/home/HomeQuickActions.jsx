import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isSalariedFamily, familyTextKey } from "../../../constants/modeExperience.js";
import {
  hiddenHomeQuickActions,
  HOME_QUICK_ACTION_IDS,
  orderHomeQuickActions,
} from "../../../utils/homeQuickActionOrder.js";
import { useDragReorder } from "../../hooks/useDragReorder.js";
import { QuickAction, QuickActionRow } from "../QuickAction.jsx";
import { ScreenSection } from "../../layout/Screen.jsx";
import MathCalculatorModal from "../modals/MathCalculatorModal.jsx";

/** @typedef {{ icon: string, labelKey: string, run: (ctx: { navigate: Function, scrollToTools: () => void, openMathCalc: () => void }) => void }} QuickActionDef */

/** @type {Record<string, QuickActionDef>} */
const HOME_QUICK_ACTION_DEFS = {
  add_bill: {
    icon: "+",
    labelKey: "copy.addBill",
    run: ({ navigate }) => navigate("/add"),
  },
  bills: {
    icon: "receipt",
    labelKey: "nav.bills",
    run: ({ navigate }) => navigate("/commitments"),
  },
  log_spend: {
    icon: "fork-knife",
    labelKey: "bills.actionLogSpend",
    run: ({ navigate }) => navigate("/commitments?tab=spend"),
  },
  lending: {
    icon: "handshake",
    labelKey: "nav.lending",
    run: ({ navigate }) => navigate("/lending"),
  },
  income: {
    icon: "currency-inr",
    labelKey: "home.actionAddIncome",
    run: ({ navigate }) => navigate("/profile", { state: { openSection: "personal-money" } }),
  },
  analytics: {
    icon: "chart-bar",
    labelKey: "nav.analytics",
    run: ({ navigate }) => navigate("/analytics"),
  },
  paycheck: {
    icon: "currency-inr",
    labelKey: "nav.paycheck",
    run: ({ navigate }) => navigate("/paycheck"),
  },
  profile: {
    icon: "user",
    labelKey: "nav.profile",
    run: ({ navigate }) => navigate("/profile"),
  },
  calculators: {
    icon: "calculator",
    labelKey: "tools.calculators",
    run: ({ scrollToTools }) => scrollToTools(),
  },
  tool_planner: {
    icon: "calendar",
    labelKey: "tools.planner.title",
    run: ({ scrollToTools }) => scrollToTools(),
  },
  tool_loan: {
    icon: "bank",
    labelKey: "tools.loan.title",
    run: ({ scrollToTools }) => scrollToTools(),
  },
  tool_tax: {
    icon: "scroll",
    labelKey: "tools.tax.title",
    run: ({ scrollToTools }) => scrollToTools(),
  },
  tool_retirement: {
    icon: "coin",
    labelKey: "tools.retirement.title",
    run: ({ scrollToTools }) => scrollToTools(),
  },
  tool_safety: {
    icon: "shield",
    labelKey: "tools.safety.title",
    run: ({ scrollToTools }) => scrollToTools(),
  },
  tool_chit: {
    icon: "coins",
    labelKey: "tools.chit.title",
    run: ({ scrollToTools }) => scrollToTools(),
  },
};

/**
 * @param {{ onOpenCalendar: () => void, scrollToTools: () => void }} props
 */
export default function HomeQuickActions({ onOpenCalendar, scrollToTools }) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCommitTrack();
  const { t } = useTranslation();
  const isFamily = isSalariedFamily(settings);
  const [reorderMode, setReorderMode] = useState(false);
  const [mathCalcOpen, setMathCalcOpen] = useState(false);

  const orderedIds = useMemo(
    () => orderHomeQuickActions(settings.homeQuickActionOrder),
    [settings.homeQuickActionOrder],
  );

  const hiddenIds = useMemo(
    () => hiddenHomeQuickActions(settings.homeQuickActionOrder),
    [settings.homeQuickActionOrder],
  );

  const persistOrder = (ids) => {
    const normalized = orderHomeQuickActions(ids);
    const allVisible =
      normalized.length === HOME_QUICK_ACTION_IDS.length && hiddenHomeQuickActions(normalized).length === 0;
    updateSettings({ homeQuickActionOrder: allVisible ? [] : normalized });
  };

  const resetOrder = () => updateSettings({ homeQuickActionOrder: [] });

  const removeAction = (id) => persistOrder(orderedIds.filter((x) => x !== id));

  const addAction = (id) => persistOrder([...orderedIds, id]);

  const { getDragProps } = useDragReorder(orderedIds, persistOrder);

  const runCtx = { navigate, scrollToTools, openMathCalc: () => setMathCalcOpen(true) };

  const sectionAction = (
    <div className="ct-row shrink-0">
      {reorderMode && (
        <button type="button" className="ct-link !text-xs" onClick={resetOrder}>
          {t("tools.resetOrder")}
        </button>
      )}
      <button
        type="button"
        onClick={() => setReorderMode((v) => !v)}
        className={`ct-btn ct-btn-sm ${reorderMode ? "ct-btn-primary" : "ct-btn-outline"}`}
      >
        {reorderMode ? t("tools.doneReorder") : t("home.reorderActions")}
      </button>
    </div>
  );

  return (
    <>
    <ScreenSection title={t("home.quickActions")} action={sectionAction}>
      {reorderMode && <p className="ct-caption mb-2">{t("home.reorderHintExpanded")}</p>}
      <QuickActionRow>
        <QuickAction
          icon="calendar"
          label={t("home.actionCalendar")}
          onClick={onOpenCalendar}
          disabled={reorderMode}
        />
        <QuickAction
          icon="calculator"
          label={t("tools.mathCalc.short")}
          onClick={() => setMathCalcOpen(true)}
          disabled={reorderMode}
        />
        {orderedIds.map((id) => {
          const def = HOME_QUICK_ACTION_DEFS[id];
          if (!def) return null;
          const icon = id === "paycheck" && isFamily ? "users-three" : def.icon;
          const labelKey =
            id === "paycheck" && isFamily
              ? "nav.incomeBreakdown"
              : id === "income"
                ? familyTextKey(settings, "home.actionAddIncome", "home.actionAddIncomeHousehold")
                : def.labelKey;
          const dragProps = getDragProps(id, { enabled: reorderMode });
          return (
            <div
              key={id}
              className={`ct-quick-action-wrap${reorderMode ? " ct-quick-action-draggable" : ""}`}
              {...dragProps}
            >
              {reorderMode && (
                <button
                  type="button"
                  className="ct-quick-action-remove"
                  aria-label={t("home.removeAction")}
                  onClick={() => removeAction(id)}
                >
                  ×
                </button>
              )}
              <QuickAction
                icon={icon}
                label={t(labelKey)}
                onClick={reorderMode ? undefined : () => def.run(runCtx)}
                disabled={reorderMode}
              />
            </div>
          );
        })}
      </QuickActionRow>
      {reorderMode && hiddenIds.length > 0 && (
        <div className="ct-stack-sm mt-3">
          <p className="ct-caption">{t("home.addAction")}</p>
          <div className="ct-row" style={{ flexWrap: "wrap" }}>
            {hiddenIds.map((id) => {
              const def = HOME_QUICK_ACTION_DEFS[id];
              if (!def) return null;
              return (
                <button
                  key={id}
                  type="button"
                  className="ct-btn ct-btn-outline ct-btn-sm"
                  onClick={() => addAction(id)}
                >
                  + {t(def.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </ScreenSection>
    {mathCalcOpen && <MathCalculatorModal onClose={() => setMathCalcOpen(false)} />}
    </>
  );
}
