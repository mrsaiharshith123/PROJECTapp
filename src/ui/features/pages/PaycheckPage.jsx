import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, PageHeader, Heading, Caption, Body } from "../../index.js";
import PaycheckBreakdown from "../analytics/PaycheckBreakdown.jsx";
import CashflowCalendarStrip from "../dashboard/CashflowCalendarStrip.jsx";
import PaycheckTimelinePanel from "../paycheck/PaycheckTimelinePanel.jsx";
import SafeToSpendCard from "../paycheck/SafeToSpendCard.jsx";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { computeSalaryBreakdown } from "../../../engines/salaryBreakdown.js";
import { buildPaycheckTimeline } from "../../../engines/paycheckTimeline.js";
import { buildIncomeSensitivityRows } from "../../../engines/pressureScore.js";
import { summarizeHouseholdPayerBurden } from "../../../engines/householdPayer.js";
import { analyzeCreditCardPressure } from "../../../engines/stabilityPlan.js";
import { getAnalyticsCopy, getIncomeLabelKey, isSalariedFamily } from "../../../constants/modeExperience.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function PaycheckPage() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus, dailySpends, todayStr } = useCommitTrack();
  const income = combinedMonthlyIncome(settings);
  const analyticsCopy = getAnalyticsCopy(settings);
  const incomeLabel = t(getIncomeLabelKey(settings));

  const paycheckFlow = useMemo(
    () =>
      analyticsCopy.showPaycheckFlow
        ? computeSalaryBreakdown(commitments, income, getEffectiveStatus, {
            dailySpends,
            todayStr,
            profileId: settings.activeProfileId || "default",
          })
        : null,
    [analyticsCopy.showPaycheckFlow, commitments, dailySpends, income, getEffectiveStatus, todayStr, settings.activeProfileId],
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
    <div className="ct-page">
      <PageHeader
        title={t("paycheck.title")}
        eyebrow={t("nav.paycheck")}
        subtitle={t("paycheck.subtitle")}
      />

      {!settings.salaryCreditDay && (
        <Card className="ct-stack-sm">
          <Body className="font-semibold">{t("paycheck.setSalaryDayTitle")}</Body>
          <Caption className="block">{t("paycheck.setSalaryDayHint")}</Caption>
          <Link to="/profile" state={{ openSection: "personal-money" }} className="ct-link text-sm font-semibold">
            {t("paycheck.setSalaryDayCta")}
          </Link>
        </Card>
      )}

      <CashflowCalendarStrip />

      <PaycheckTimelinePanel timeline={timeline} />

      <SafeToSpendCard
        bufferAfterBills={timeline.bufferAfterBills}
        salaryCreditDay={settings.salaryCreditDay}
        todayStr={todayStr}
      />

      <Card className="ct-stack">
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
      </Card>
    </div>
  );
}
