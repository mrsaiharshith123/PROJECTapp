import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { HeroMonthCard } from "../HeroMonthCard.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { formatMonthYear } from "../../../i18n/formatLocale.js";
import { translateHealthLabel, translatePressureLabel } from "../../../i18n/engineLabels.js";

export default function HomeOverviewCard() {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const { commitments, settings, getEffectiveStatus, todayStr } = useCommitTrack();
  const intel = useCommitIntel();
  const experienceMode = getExperienceMode(settings);
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const income = combinedMonthlyIncome(settings);

  const monthSummary = useMemo(
    () => computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income),
    [commitments, getEffectiveStatus, todayStr, income],
  );

  const overdueCount = useMemo(
    () => commitments.filter((c) => getEffectiveStatus(c) === "overdue").length,
    [commitments, getEffectiveStatus],
  );

  const health = intel.health;
  const pressure = intel.stability;
  const monthLabel = useMemo(
    () => formatMonthYear(locale, todayStr),
    [locale, todayStr],
  );

  const statusLine = health ? (
    <>
      {t("home.health")} <strong>{health.score}</strong> · {translateHealthLabel(t, health)}
      {pressure?.score != null && (
        <>
          {" "}
          · {t("home.pressure")} {translatePressureLabel(t, pressure.label)}{" "}
          <strong>{pressure.score}</strong>/100
        </>
      )}
      {overdueCount === 0 ? (
        <>
          {" "}
          · <span className="ct-text-success">{t("home.noOverdue")}</span>
        </>
      ) : (
        <>
          {" "}
          · <span className="ct-text-warning">{t("home.overdueCount", { count: overdueCount })}</span>
        </>
      )}
    </>
  ) : null;

  const title =
    experienceMode === "salaried"
      ? t("home.thisMonth")
      : experienceMode === "family"
        ? t("home.householdMonth")
        : t("mode.salaried");

  const footerLeft = (
    <>
      {t("home.stillDue")} <strong>{formatInr(monthSummary.dueThisMonth)}</strong>
      {monthSummary.duePercentOfIncome ? (
        <span> · {t("home.stillDueOfIncome", { percent: monthSummary.duePercentOfIncome })}</span>
      ) : income <= 0 ? (
        <span> · {t("home.setIncomeInProfile")}</span>
      ) : null}
    </>
  );

  const freeLabel = experienceMode === "family" ? t("home.householdCash") : t("home.freeCash");

  const footerRight = (
    <>
      {freeLabel}{" "}
      <strong className="ct-hero-metric-success">
        {monthSummary.freeCash != null ? formatInr(monthSummary.freeCash) : EM_DASH}
      </strong>
    </>
  );

  return (
    <HeroMonthCard
      title={title}
      monthLabel={monthLabel}
      emoji={modeCfg.emoji}
      left={formatInr(monthSummary.leftThisMonth)}
      paid={formatInr(monthSummary.paidThisMonth)}
      due={formatInr(monthSummary.dueThisMonth)}
      paidPct={monthSummary.paidPct}
      footerLeft={footerLeft}
      footerRight={footerRight}
      statusLine={statusLine}
      onClick={() => navigate("/analytics")}
    />
  );
}
