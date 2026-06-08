import { differenceInMonths, format, parseISO } from "date-fns";
import { Caption } from "../primitives/Text.jsx";

const LOAN_CATEGORIES = new Set(["EMI", "Loan", "Credit Card", "BNPL"]);

/**
 * Thin loan/EMI lifecycle bar — month X of Y.
 * @param {{ commitment: object, effectiveStatus?: string }} props
 */
export function CommitmentProgress({ commitment, effectiveStatus = "pending" }) {
  if (!commitment?.startDate || !commitment?.endDate) return null;
  if (commitment.repeatType !== "monthly") return null;
  if (!LOAN_CATEGORIES.has(commitment.category)) return null;

  let start;
  let end;
  try {
    start = parseISO(commitment.startDate);
    end = parseISO(commitment.endDate);
  } catch {
    return null;
  }

  const today = new Date();
  const totalMonths = Math.max(1, differenceInMonths(end, start));
  const doneMonths = Math.min(totalMonths, Math.max(0, differenceInMonths(today, start)));
  const pct = Math.min(100, Math.round((doneMonths / totalMonths) * 100));

  let barClass = "ct-progress-bar";
  if (effectiveStatus === "overdue") barClass += " ct-progress-bar-danger";
  else if (pct >= 80) barClass += " ct-progress-bar-success";
  else if (pct >= 50) barClass += " ct-progress-bar-warning";

  return (
    <div className="ct-stack-sm" style={{ marginTop: "0.75rem" }}>
      <div className="ct-progress">
        <div className={`${barClass} ct-bar-animated`} style={{ width: `${pct}%` }} />
      </div>
      <Caption className="block">
        Month {doneMonths} of {totalMonths} · {pct}% complete · ends {format(end, "MMM yyyy")}
      </Caption>
    </div>
  );
}

export default CommitmentProgress;
