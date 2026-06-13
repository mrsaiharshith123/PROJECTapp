import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import {
  computeOverallMonthlySpend,
  spendPctOfSalary,
} from "../../../utils/salarySpendBar.js";
import {
  buildMonthCumulativeSpendSeries,
} from "../../../utils/monthSpendSeries.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { HeroMonthCard } from "../HeroMonthCard.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatMonthYear } from "../../../i18n/formatLocale.js";
import { translatePressureLabel } from "../../../i18n/engineLabels.js";

export default function HomeOverviewCard() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const {
    commitments,
    lendings,
    dailySpends,
    settings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
  } = useCommitTrack();
  const intel = useCommitIntel();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const experienceMode = getExperienceMode(settings);
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const income = combinedMonthlyIncome(settings);
  const profileId = settings.activeProfileId || "default";

  const monthSummary = useMemo(
    () =>
      computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income, {
        dailySpends,
        lendings,
        getEffectiveLendingStatus,
        profileId,
      }),
    [
      commitments,
      lendings,
      dailySpends,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      todayStr,
      income,
      profileId,
    ],
  );

  const spendSeries = useMemo(
    () => buildMonthCumulativeSpendSeries(commitments, dailySpends, todayStr, profileId),
    [commitments, dailySpends, todayStr, profileId],
  );

  const overdueCount = useMemo(
    () => commitments.filter((c) => getEffectiveStatus(c) === "overdue").length,
    [commitments, getEffectiveStatus],
  );

  const pressure = intel.stability;
  const monthLabel = useMemo(() => formatMonthYear(locale, todayStr), [locale, todayStr]);

  const overallSpend = computeOverallMonthlySpend(monthSummary.paidThisMonth, monthSummary.spentThisMonth);
  const spendPct = spendPctOfSalary(overallSpend, income);
  const overBudget = income > 0 && overallSpend > income;

  const guidance = monthSummary.spendGuidance;
  const spendTip =
    guidance?.isTight && guidance.dailyLifestyleCap > 0
      ? t("home.statusSpendTight", { amount: formatInr(guidance.dailyLifestyleCap) })
      : guidance?.dailyTotalCap > 0
        ? t("home.statusSpendFlexible", { amount: formatInr(guidance.dailyTotalCap) })
        : null;

  const statusLine = pressure?.score != null ? (
    <div className="ct-stack-sm !gap-1.5">
      <p className="ct-body !text-xs leading-snug">
        {t("home.statusStress", {
          score: pressure.score,
          label: translatePressureLabel(t, pressure.label),
        })}{" "}
        <span className={overdueCount === 0 ? "ct-text-success" : "ct-text-warning"}>
          {overdueCount === 0
            ? t("home.statusOverdueNone")
            : t("home.statusOverdue", { count: overdueCount })}
        </span>
      </p>
      {spendTip ? (
        <p className={`ct-body !text-xs leading-snug ${guidance?.isTight ? "ct-text-warning" : "ct-text-secondary"}`}>
          {spendTip}
        </p>
      ) : null}
    </div>
  ) : null;

  const title =
    experienceMode === "salaried"
      ? t("home.thisMonth")
      : experienceMode === "family"
        ? t("home.householdMonth")
        : t("mode.salaried");

  const freeCashLabel = experienceMode === "family" ? t("home.householdCash") : t("home.freeCash");

  const salaryLabel =
    income > 0
      ? t("home.salarySpendOf", {
          spent: formatInr(overallSpend),
          salary: formatInr(income),
        })
      : t("home.salarySpendNoIncome", { spent: formatInr(overallSpend) });

  return (
    <HeroMonthCard
      title={title}
      monthLabel={monthLabel}
      icon={modeCfg.icon}
      scheduled={formatInr(monthSummary.scheduledThisMonth)}
      paid={formatInr(monthSummary.paidThisMonth)}
      unpaid={formatInr(monthSummary.dueThisMonth)}
      variableSpent={formatInr(monthSummary.spentThisMonth)}
      freeCashLabel={freeCashLabel}
      freeCashValue={monthSummary.freeCash != null ? formatInr(monthSummary.freeCash) : EM_DASH}
      freeCashWarn={monthSummary.freeCash != null && monthSummary.freeCash < 0}
      spendPct={spendPct}
      salaryLabel={salaryLabel}
      spendSeries={spendSeries}
      monthlyIncome={income}
      overBudget={overBudget}
      statusLine={statusLine}
      privacyMode={privacyMode}
      onTogglePrivacy={togglePrivacyMode}
      onClick={() => navigate("/analytics")}
    />
  );
}
