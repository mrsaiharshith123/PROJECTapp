import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { orderHomeQuickActions } from "../../../utils/homeQuickActionOrder.js";
import { useDragReorder } from "../../hooks/useDragReorder.js";
import { QuickAction, QuickActionRow } from "../QuickAction.jsx";
import { ScreenSection } from "../../layout/Screen.jsx";

const ACTION_DEFS = {
  lending: { icon: "handshake", labelKey: "nav.lending", run: (nav) => nav("/lending") },
  income: { icon: "currency-inr", labelKey: "home.actionAddIncome", run: (nav) => nav("/profile") },
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

  const persistOrder = (ids) => updateSettings({ homeQuickActionOrder: ids });

  const resetOrder = () => updateSettings({ homeQuickActionOrder: [] });

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
              <QuickAction
                icon={def.icon}
                label={t(def.labelKey)}
                onClick={reorderMode ? undefined : () => def.run(navigate, scrollToTools)}
              />
            </div>
          );
        })}
      </QuickActionRow>
    </ScreenSection>
  );
}
