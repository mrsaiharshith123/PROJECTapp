import { useMemo } from "react";
import { Caption, EmptyState } from "../../../index.js";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../../context/NetWorthContext.jsx";
import { buildProfileAchievements } from "../../../../engines/profileAchievements.js";
import { commitmentToIncomeRatio } from "../../../../engines/pressureScore.js";
import { combinedMonthlyIncome } from "../../../../utils/combinedIncome.js";
import { formatAchievementDate } from "../../../../i18n/formatLocale.js";
import { SettingsGroup, SettingsGroupContent } from "../SettingsGroup.jsx";

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
  } = usePerovo();

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
    <SettingsGroup
      title={t("profileHub.milestonesTitle")}
      icon="target"
      description={t("profileHub.milestonesSubtitle")}
    >
      <SettingsGroupContent>
        {achievements.length === 0 ? (
          <EmptyState
            icon="trophy"
            title={t("profileHub.milestonesEmpty")}
            hint={t("profileHub.milestonesEmptyHint")}
          />
        ) : (
          <ul className="ed-stack-sm">
            {achievements.map((item) => {
              const label = item.labelIsKey
                ? t(item.label, item.labelParams || {})
                : item.labelSuffixKey
                  ? `${item.label} — ${t(item.labelSuffixKey)}`
                  : item.label;
              return (
                <li key={item.id} className="ed-stat-tile teal">
                  <div className="ed-row-between gap-2">
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
      </SettingsGroupContent>
    </SettingsGroup>
  );
}
