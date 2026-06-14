import { useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import {
  addContribution,
  computeSharedGoalProgress,
  getContributionSuggestion,
} from "../../../engines/sharedGoalContribution.js";
import { postRoomEvent } from "../../../services/household/householdRoomService.js";
import { formatInr } from "../../../constants/symbols.js";
import { Card, Body, Caption, Button, ProgressBar } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ goal: object, settings: object }} props
 */
export default function SharedGoalCard({ goal, settings }) {
  const { t } = useTranslation();
  const { updateGoal } = useCommitTrack();
  const { user } = useAuth();
  const progress = computeSharedGoalProgress(goal, settings);
  const suggestion = getContributionSuggestion(goal, settings);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const saveContribution = () => {
    const amt = Math.max(0, Number(amount) || 0);
    if (amt <= 0) return;
    setSaving(true);
    const nextContrib = addContribution(goal, amt, "self");
    const nextSaved = Math.max(0, Number(goal.savedAmount) || 0) + amt;
    updateGoal(goal.id, {
      memberContributions: nextContrib,
      savedAmount: nextSaved,
    });
    if (settings.householdRoomId && user?.id) {
      const pct =
        progress.total > 0 ? Math.min(100, Math.round((nextSaved / progress.total) * 100)) : 0;
      postRoomEvent({
        roomId: settings.householdRoomId,
        userId: user.id,
        displayName: settings.displayName || "Member",
        eventType: "goal_progress",
        eventData: { goalName: goal.title, pct },
      });
    }
    setAmount("");
    setSaving(false);
  };

  const selfPct = progress.total > 0 ? Math.min(100, Math.round((progress.selfAmt / progress.total) * 100)) : 0;
  const spousePct = progress.total > 0 ? Math.min(100, Math.round((progress.spouseAmt / progress.total) * 100)) : 0;

  return (
    <Card className="ct-stack-sm">
      <div className="ct-row-between gap-2">
        <Body className="font-semibold truncate">{goal.title}</Body>
        <Caption>{formatInr(progress.total)}</Caption>
      </div>
      {goal.targetDate ? (
        <Caption className="block">{t("goals.shared.due", { date: goal.targetDate })}</Caption>
      ) : null}
      <ProgressBar value={progress.pct} />
      <Caption className="block">{t("goals.shared.overallPct", { pct: progress.pct })}</Caption>
      <div className="ct-stack-sm">
        <div>
          <Caption>{t("goals.shared.contribLine", { name: progress.selfName, amount: formatInr(progress.selfAmt) })}</Caption>
          <ProgressBar value={selfPct} />
        </div>
        <div>
          <Caption>
            {t("goals.shared.contribLine", { name: progress.spouseName, amount: formatInr(progress.spouseAmt) })}
          </Caption>
          <ProgressBar value={spousePct} />
        </div>
      </div>
      {suggestion ? (
        <Caption className="block">
          {t("goals.shared.monthlySuggestion", {
            date: goal.targetDate,
            amount: formatInr(suggestion.perPerson),
          })}
        </Caption>
      ) : null}
      <div className="ct-row gap-2">
        <input
          type="number"
          min="0"
          className="ct-input flex-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("goals.addAmount", { currency: "₹" })}
        />
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={saveContribution}>
          {t("goals.shared.addMyContribution")}
        </Button>
      </div>
    </Card>
  );
}
