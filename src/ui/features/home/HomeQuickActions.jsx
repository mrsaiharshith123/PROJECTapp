import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  hiddenHomeQuickActions,
  orderHomeQuickActions,
} from "../../../utils/homeQuickActionOrder.js";
import { useDragReorder } from "../../hooks/useDragReorder.js";
import { QuickAction, QuickActionRow } from "../QuickAction.jsx";
import { ScreenSection } from "../../layout/Screen.jsx";

const ACTION_DEFS = {
  lending: { icon: "handshake", labelKey: "nav.lending", run: (nav) => nav("/lending") },
  income: {
    icon: "currency-inr",
    labelKey: "home.actionAddIncome",
    run: (nav) => nav("/profile", { state: { openSection: "personal-money" } }),
  },
  calculators: { icon: "calculator", labelKey: "tools.calculators", run: (_nav, scrollToTools) => scrollToTools() },
  analytics: { icon: "chart-bar", labelKey: "nav.analytics", run: (nav) => nav("/analytics") },
};

/**
 * @param {{ onOpenCalendar: () => void, scrollToTools: () => void }} props
 */
export default function HomeQuickActions({ onOpenCalendar, scrollToTools }) {
  const navigate = useNavigate();
  const { settings, updateSettings } = useCommitTrack();
  const { t } = useTranslation();
  const [reorderMode, setReorderMode] = useState(false);

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
      normalized.length === ACTION_DEFS.length &&
      hiddenHomeQuickActions(normalized).length === 0;
    updateSettings({ homeQuickActionOrder: allVisible ? [] : normalized });
  };

  const resetOrder = () => updateSettings({ homeQuickActionOrder: [] });

  const removeAction = (id) => persistOrder(orderedIds.filter((x) => x !== id));

  const addAction = (id) => persistOrder([...orderedIds, id]);

  const { getDragProps } = useDragReorder(orderedIds, persistOrder);

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
    <ScreenSection title={t("home.quickActions")} action={sectionAction}>
      {reorderMode && <p className="ct-caption mb-2">{t("home.reorderHint")}</p>}
      <QuickActionRow>
        <QuickAction
          icon="calendar"
          label={t("home.actionCalendar")}
          onClick={onOpenCalendar}
          disabled={reorderMode}
        />
        <QuickAction icon="+" label={t("copy.addBill")} onClick={() => navigate("/add")} disabled={reorderMode} />
        {orderedIds.map((id) => {
          const def = ACTION_DEFS[id];
          if (!def) return null;
          const dragProps = getDragProps(id, { enabled: reorderMode });
          return (
            <div key={id} className={`ct-quick-action-wrap${reorderMode ? " ct-quick-action-draggable" : ""}`} {...dragProps}>
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
                icon={def.icon}
                label={t(def.labelKey)}
                onClick={reorderMode ? undefined : () => def.run(navigate, scrollToTools)}
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
              const def = ACTION_DEFS[id];
              if (!def) return null;
              return (
                <button key={id} type="button" className="ct-btn ct-btn-outline ct-btn-sm" onClick={() => addAction(id)}>
                  + {t(def.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {reorderMode && hiddenIds.length === 0 && orderedIds.length === ACTION_DEFS.length && (
        <p className="ct-caption mt-2">{t("home.allActionsVisible")}</p>
      )}
    </ScreenSection>
  );
}
