import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PageShell, Heading, Caption, Body } from "../../index.js";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import CashflowCalendarStrip from "../dashboard/CashflowCalendarStrip.jsx";
import PaycheckTimelinePanel from "../paycheck/PaycheckTimelinePanel.jsx";
import SafeToSpendCard from "../paycheck/SafeToSpendCard.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { buildPaycheckTimeline } from "../../../engines/paycheckTimeline.js";
import { buildIncomeSensitivityRows } from "../../../engines/pressureScore.js";
import { summarizeHouseholdPayerBurden } from "../../../engines/householdPayer.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { getAnalyticsCopy, getIncomeLabelKey, isSalariedFamily, resolveDataProfileScope } from "../../../constants/modeExperience.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";

export default function PaycheckPage() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus, dailySpends, todayStr } = usePerovo();
  const isFamily = isSalariedFamily(settings);
  const income = combinedMonthlyIncome(settings);
  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));

  const profileScope = resolveDataProfileScope(settings);

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus, {
            dailySpends,
            todayStr,
            profileId: profileScope,
          })
        : null,
    [analyticsCopy.showPaycheckFlow, commitments, dailySpends, income, getEffectiveStatus, todayStr, profileScope],
  );

  const timeline = useMemo(
    () =>
      buildPaycheckTimeline({
        commitments,
        getEffectiveStatus,
        salaryCreditDay: settings.salaryCreditDay,
        income,
        todayStr,
      }),
    [commitments, getEffectiveStatus, settings.salaryCreditDay, income, todayStr],
  );

  const payerSplit = useMemo(() => {
    if (!isSalariedFamily(settings)) return null;
    const { by } = summarizeHouseholdPayerBurden(commitments, getEffectiveStatus);
    const rows = [];
    if (by.primary > 0) rows.push({ label: t("analytics.payerPrimary"), amount: by.primary });
    if (by.secondary > 0) rows.push({ label: t("analytics.payerSecondary"), amount: by.secondary });
    if (by.shared > 0) rows.push({ label: t("analytics.payerShared"), amount: by.shared });
    return rows.length ? { rows } : null;
  }, [settings, commitments, getEffectiveStatus, t]);

  const cardPressure = useMemo(
    () => (analyticsCopy.showPaycheckFlow ? analyzeCreditCardPressure(commitments, getEffectiveStatus, income) : null),
    [analyticsCopy.showPaycheckFlow, commitments, getEffectiveStatus, income],
  );

  const sensitivityRows = useMemo(
    () => (analyticsCopy.showPaycheckFlow && income > 0 ? buildIncomeSensitivityRows(commitments, income, getEffectiveStatus) : []),
    [analyticsCopy.showPaycheckFlow, commitments, income, getEffectiveStatus],
  );

  return (
    <PageShell
      title={isFamily ? t("paycheck.titleHousehold") : t("paycheck.title")}
      subtitle={isFamily ? t("paycheck.subtitleHousehold", { income: formatInr(income) }) : t("paycheck.subtitle")}
    >

      {!settings.salaryCreditDay && (
        <div className="ct-hero-card survival relative ct-stack-sm">
          <div className="ct-hero-glow amber" aria-hidden />
          <Body className="font-semibold relative">{t("paycheck.setSalaryDayTitle")}</Body>
          <Caption className="block relative">{t("paycheck.setSalaryDayHint")}</Caption>
          <Link to="/profile" state={{ openSection: "personal-money" }} className="ct-link text-sm font-semibold relative">
            {t("paycheck.setSalaryDayCta")}
          </Link>
        </div>
      )}

      <CashflowCalendarStrip />

      <SafeToSpendCard
        bufferAfterBills={timeline.bufferAfterBills}
        salaryCreditDay={settings.salaryCreditDay}
        todayStr={todayStr}
        scope={isFamily ? "household" : "personal"}
      />

      <PaycheckTimelinePanel timeline={timeline} />

      <section className="ct-stack">
        <Heading level={3}>{t("analytics.paycheckBurden")}</Heading>
        <Caption className="block mt-1">{t("analytics.paycheckSubtitle")}</Caption>
        <PaycheckBreakdown
          breakdown={paycheckFlow}
          anchorId="paycheck-flow-page"
          incomeStepLabel={incomeLabel}
          incomeEntryBasis={settings.incomeEntryBasis === "gross" ? "gross" : "take_home"}
          payerSplit={payerSplit}
          creditCard={cardPressure}
          sensitivityRows={sensitivityRows}
        />
      </section>
    </PageShell>
  );
}
