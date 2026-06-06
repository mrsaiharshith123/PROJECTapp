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

export default function HomeOverviewCard() {
  const navigate = useNavigate();
  const { commitments, settings, getEffectiveStatus, todayStr } = useCommitTrack();
  const intel = useCommitIntel();
  const experienceMode = getExperienceMode(settings);
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const income = combinedMonthlyIncome(settings);

  const monthSummary = useMemo(
    () => computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income),
    [commitments, getEffectiveStatus, todayStr, income]
  );

  const overdueCount = useMemo(
    () => commitments.filter((c) => getEffectiveStatus(c) === "overdue").length,
    [commitments, getEffectiveStatus]
  );

  const health = intel.health;
  const pressure = intel.stability;
  const statusLine = health ? (
    <>
      Health <strong>{health.score}</strong> · {health.label}
      {pressure?.score != null && (
        <> · Pressure {pressure.label} <strong>{pressure.score}</strong>/100</>
      )}
      {overdueCount === 0 ? (
        <> · <span className="ct-text-success">All caught up</span></>
      ) : (
        <> · <span className="ct-text-warning">{overdueCount} overdue</span></>
      )}
    </>
  ) : null;

  const title =
    experienceMode === "salaried"
      ? "This month"
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

  const freeLabel = experienceMode === "family" ? "Household cash" : "Free cash";

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
      statusLine={statusLine}
      onClick={() => navigate("/analytics")}
    />
  );
}
