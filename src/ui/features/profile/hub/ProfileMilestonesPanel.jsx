import { useMemo } from "react";
import { Card, Caption, Heading, EmptyState } from "../../../index.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { useCommitTrack } from "../../../../context/CommitTrackContext.jsx";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { buildProfileAchievements } from "../../../../engines/profileAchievements.js";
import { commitmentToIncomeRatio } from "../../../../engines/pressureAdvanced.js";
import { combinedMonthlyIncome } from "../../../../utils/combinedIncome.js";
import { formatAchievementDate } from "../../../../i18n/formatLocale.js";

export default function ProfileMilestonesPanel() {
  const { t, locale } = useTranslation();
  const { milestones } = useNetWorth();
  const {
    allGoals,
    commitments,
    lendings,
    settings,
    getEffectiveStatus,
    todayStr,
  } = useCommitTrack();

  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  const income = combinedMonthlyIncome(settings);
  const ratio = commitmentToIncomeRatio(commitments, income, getEffectiveStatus);

  const achievements = useMemo(
    () =>
      buildProfileAchievements({
        milestones,
        goals: allGoals,
        commitments,
        lendings,
        getEffectiveStatus,
        todayStr,
        goalCtx: { openRemainingSum: openRemaining, burdenRatio: ratio },
      }),
    [milestones, allGoals, commitments, lendings, getEffectiveStatus, todayStr, openRemaining, ratio],
  );

  return (
    <Card className="ct-nw-panel ct-stack">
      <Heading level={3}>{t("profileHub.milestonesTitle")}</Heading>
      <Caption className="block mt-1">{t("profileHub.milestonesSubtitle")}</Caption>

      {achievements.length === 0 ? (
        <EmptyState
          icon="trophy"
          title={t("profileHub.milestonesEmpty")}
          hint={t("profileHub.milestonesEmptyHint")}
        />
      ) : (
        <ul className="ct-stack-sm mt-3">
          {achievements.map((item) => {
            const label = item.labelIsKey
              ? t(item.label, item.labelParams || {})
              : item.labelSuffixKey
                ? `${item.label} — ${t(item.labelSuffixKey)}`
                : item.label;
            return (
              <li key={item.id} className={`ct-nw-insight ct-nw-insight-positive ct-nw-milestone-row`}>
                <div className="ct-row-between gap-2">
                  <span>{label}</span>
                  {item.achievedAt > 0 && (
                    <Caption className="shrink-0">
                      {formatAchievementDate(locale, item.achievedAt)}
                    </Caption>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
