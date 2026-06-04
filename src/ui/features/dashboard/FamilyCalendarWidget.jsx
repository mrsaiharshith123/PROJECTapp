import { useMemo } from "react";
import { Card, Heading, Caption } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { buildFamilyExpenseCalendar } from "../../../engines/familyCalendar.js";

export default function FamilyCalendarWidget() {
  const { commitments, getEffectiveStatus, todayStr } = useCommitTrack();

  const cal = useMemo(
    () => buildFamilyExpenseCalendar(commitments, todayStr, getEffectiveStatus, 6),
    [commitments, todayStr, getEffectiveStatus],
  );

  const heavyKeys = new Set((cal.heavyMonths || []).map((m) => m.monthKey));

  return (
    <Card className="ct-stack">
      <Heading level={3}>Family expense calendar</Heading>
      <div className="ct-row-wrap">
        {(cal.months || []).slice(0, 6).map((m) => (
          <div
            key={m.monthKey}
            className={`ct-stat-cell ${heavyKeys.has(m.monthKey) ? "ct-status ct-status-warning" : ""}`}
            style={{ minWidth: "100px" }}
          >
            <p className="ct-stat-cell-label">{m.label}</p>
            <p className="ct-stat-cell-value">₹{Math.round(m.amount).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>
      {(cal.insights || []).map((ins) => (
        <Caption key={ins.id} className="block">
          {ins.text}
        </Caption>
      ))}
    </Card>
  );
}
