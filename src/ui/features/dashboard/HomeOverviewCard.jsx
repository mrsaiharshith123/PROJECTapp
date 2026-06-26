import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { getExperienceMode, isSalariedFamily, resolveDataProfileScope } from "../../../constants/modeExperience.js";
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
import { computeMomentumScore } from "../../../engines/momentumScore.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import HouseholdDependentsEditorModal from "../modals/HouseholdDependentsEditorModal.jsx";
import { useCountUp } from "../../hooks/useCountUp.js";

export default function HomeOverviewCard() {
  const [editHouseholdOpen, setEditHouseholdOpen] = useState(false);
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
    monthlySnapshots,
  } = usePerovo();
  const intel = useCommitIntel();
  const { privacyMode, togglePrivacyMode } = useNetWorth();
  const experienceMode = getExperienceMode(settings);
  const isFamily = isSalariedFamily(settings);
  const modeCfg = isFamily
    ? { icon: "users-three", label: "family" }
    : getUserModeConfig(settings.userMode || "salaried");
  const income = combinedMonthlyIncome(settings);
  const profileScope = resolveDataProfileScope(settings);

  const monthSummary = useMemo(
    () =>
      computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income, {
        dailySpends,
        lendings,
        getEffectiveLendingStatus,
        profileId: profileScope,
      }),
    [
      commitments,
      lendings,
      dailySpends,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      todayStr,
      income,
      profileScope,
    ],
  );

  const spendSeries = useMemo(
    () => buildMonthCumulativeSpendSeries(commitments, dailySpends, todayStr, profileScope),
    [commitments, dailySpends, todayStr, profileScope],
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
      ? t(
          isFamily ? "home.statusSpendTightHousehold" : "home.statusSpendTight",
          { amount: formatInr(guidance.dailyLifestyleCap) },
        )
      : guidance?.dailyTotalCap > 0
        ? t(
            isFamily ? "home.statusSpendFlexibleHousehold" : "home.statusSpendFlexible",
            { amount: formatInr(guidance.dailyTotalCap) },
          )
        : null;

  const momentum = useMemo(() => {
    if (isFamily) return null;
    return computeMomentumScore({ monthlySnapshots, commitments, getEffectiveStatus });
  }, [isFamily, monthlySnapshots, commitments, getEffectiveStatus]);

  const statusLine = pressure?.score != null ? (
    <div className="ct-stat-tile teal ct-stack-sm !gap-1.5">
      <p className="ct-body !text-xs leading-snug">
        {t(
          isFamily ? "home.statusStressHousehold" : "home.statusStress",
          {
            score: pressure.score,
            label: translatePressureLabel(t, pressure.label),
          },
        )}{" "}
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
      ) : income <= 0 ? (
        <p className="ct-body !text-xs leading-snug ct-text-warning">
          {t("scoreDetail.setIncomeHint")}{" "}
          <button
            type="button"
            className="ct-link !text-xs"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/you/personal");
            }}
          >
            {t("profile.setIncome")}
          </button>
        </p>
      ) : null}
      {momentum ? (
        <p className="ct-body !text-xs leading-snug ct-row gap-1.5 items-center">
          <CtIcon name="chart-line-up" size={16} context="status" />
          <span>
            {t(momentum.labelKey)} · {t("home.momentum.streak", { months: momentum.streakMonths })}
          </span>
        </p>
      ) : null}
    </div>
  ) : null;

  const title =
    experienceMode === "family"
      ? t("home.householdMonth")
      : experienceMode === "salaried"
        ? t("home.thisMonth")
        : t("home.thisMonth");

  const scopeBadge = isFamily ? t("mode.family") : null;

  const freeCashLabel = experienceMode === "family" ? t("home.householdCash") : t("home.freeCash");

  const salaryLabel =
    income > 0
      ? t(isFamily ? "home.salarySpendOfHousehold" : "home.salarySpendOf", {
          spent: formatInr(overallSpend),
          salary: formatInr(income),
        })
      : t(isFamily ? "home.salarySpendNoIncomeHousehold" : "home.salarySpendNoIncome", {
          spent: formatInr(overallSpend),
        });

  const spendTitleKey = isFamily ? "home.salarySpendTitleHousehold" : "home.salarySpendTitle";

  const countedFreeCash = useCountUp(Math.max(0, Math.round(monthSummary.freeCash ?? 0)), 900);
  const countedScheduled = useCountUp(Math.max(0, Math.round(monthSummary.scheduledThisMonth ?? 0)));
  const countedPaid = useCountUp(Math.max(0, Math.round(monthSummary.paidThisMonth ?? 0)));
  const countedUnpaid = useCountUp(Math.max(0, Math.round(monthSummary.dueThisMonth ?? 0)));

  return (
    <>
      <HeroMonthCard
        className={isFamily ? "survival" : "pressure"}
        title={title}
        monthLabel={monthLabel}
        icon={isFamily ? undefined : modeCfg.icon}
        householdCount={isFamily ? Math.max(0, Number(settings.dependents) || 0) : undefined}
        onEditHousehold={isFamily ? () => setEditHouseholdOpen(true) : undefined}
        scopeBadge={scopeBadge}
        scheduled={formatInr(countedScheduled)}
        paid={formatInr(countedPaid)}
        unpaid={formatInr(countedUnpaid)}
        variableSpent={formatInr(monthSummary.spentThisMonth)}
        freeCashLabel={freeCashLabel}
        freeCashValue={monthSummary.freeCash != null ? formatInr(countedFreeCash) : EM_DASH}
        freeCashWarn={monthSummary.freeCash != null && monthSummary.freeCash < 0}
        spendPct={spendPct}
        spendTitleKey={spendTitleKey}
        salaryLabel={salaryLabel}
        spendSeries={spendSeries}
        monthlyIncome={income}
        overBudget={overBudget}
        sparklineHousehold={isFamily}
        statusLine={statusLine}
        privacyMode={privacyMode}
        onTogglePrivacy={togglePrivacyMode}
        onClick={() => navigate("/insights/score")}
      />
      {isFamily ? (
        <HouseholdDependentsEditorModal open={editHouseholdOpen} onClose={() => setEditHouseholdOpen(false)} />
      ) : null}
    </>
  );
}
