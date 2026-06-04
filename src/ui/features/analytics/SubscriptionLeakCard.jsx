import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Badge, Heading, Caption, Body } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { subscriptionLeakReport } from "../../../engines/subscriptionLeak.js";

export default function SubscriptionLeakCard() {
  const { commitments, getEffectiveStatus, todayStr } = useCommitTrack();
  const navigate = useNavigate();

  const report = useMemo(
    () => subscriptionLeakReport(commitments, getEffectiveStatus, todayStr),
    [commitments, getEffectiveStatus, todayStr],
  );

  const luxury = (report.classified || []).filter((r) => r.tag === "Luxury" || r.tag === "Optional");
  const luxuryMonthly = luxury.reduce((s, r) => s + (r.monthly || 0), 0);

  return (
    <Card className="ct-stack">
      <Heading level={3}>Subscription audit</Heading>
      <Body>
        Total subscription spend (est.):{" "}
        <strong>₹{Math.round(report.monthlyEquivalent).toLocaleString("en-IN")}/mo</strong>
      </Body>
      {luxuryMonthly > 1500 && (
        <Caption className="block text-[var(--ct-warning)]">
          Luxury / optional: ~₹{Math.round(luxuryMonthly).toLocaleString("en-IN")}/mo — worth reviewing.
        </Caption>
      )}
      <ul className="ct-stack-sm">
        {luxury.slice(0, 6).map((r) => (
          <li key={r.name} className="ct-row-between">
            <span className="ct-caption">{r.name}</span>
            <span className="ct-row-wrap">
              <Badge tone="neutral">{r.tag}</Badge>
              <Caption>₹{Math.round(r.monthly).toLocaleString("en-IN")}/mo</Caption>
            </span>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => navigate("/commitments?filter=Subscription")}
      >
        Review subscriptions →
      </Button>
    </Card>
  );
}
