import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { formatInr, EM_DASH } from "../../../constants/symbols.js";
import { HeroMonthCard } from "../HeroMonthCard.jsx";

export default function HomeOverviewCard() {
  const navigate = useNavigate();
  const { commitments, settings, getEffectiveStatus, todayStr } = useCommitTrack();
  const experienceMode = getExperienceMode(settings);
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const income = combinedMonthlyIncome(settings);

  const monthSummary = useMemo(
    () => computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income),
    [commitments, getEffectiveStatus, todayStr, income]
  );

  const active = commitments.filter((c) => isActiveBill(c, getEffectiveStatus, todayStr));
  const subs = active.filter((c) => c.category === "Subscription");
  const emis = active.filter((c) => c.category === "EMI");

  const title =
    experienceMode === "salaried"
      ? "This month"
      : experienceMode === "business"
        ? "Cashflow"
        : experienceMode === "family"
          ? "Household month"
          : modeCfg.label;

  const footerLeft = (
    <>
      Still due <strong>{formatInr(monthSummary.dueThisMonth)}</strong>
      {monthSummary.duePercentOfIncome ? (
        <span> · {monthSummary.duePercentOfIncome} of income</span>
      ) : income <= 0 ? (
        <span> · set income in Profile</span>
      ) : null}
    </>
  );

  const freeLabel =
    experienceMode === "business"
      ? "Operating buffer"
      : experienceMode === "family"
        ? "Household cash"
        : "Free cash";

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
      monthLabel={monthSummary.monthLabel}
      emoji={modeCfg.emoji}
      left={formatInr(monthSummary.leftThisMonth)}
      paid={formatInr(monthSummary.paidThisMonth)}
      due={formatInr(monthSummary.dueThisMonth)}
      paidPct={monthSummary.paidPct}
      footerLeft={footerLeft}
      footerRight={footerRight}
      footerRow2Left={
        experienceMode === "salaried" || experienceMode === "family" ? (
          <>
            EMIs <strong>{emis.length}</strong>
          </>
        ) : null
      }
      footerRow2Right={
        experienceMode === "salaried" || experienceMode === "family" ? (
          <>
            Subs <strong>{subs.length}</strong>
          </>
        ) : null
      }
      onClick={() => navigate("/analytics")}
    />
  );
}
