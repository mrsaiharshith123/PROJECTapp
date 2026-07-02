function verdictPillClass(verdict) {
  if (verdict === "hold" || verdict === "hold_moderate" || verdict === "hold_mature") return "hold";
  if (verdict === "wait") return "wait";
  if (verdict === "review") return "review";
  return "neutral";
}

function verdictLabelKey(verdict) {
  if (verdict === "hold_mature") return "wealthDetail.verdict.holdMature";
  if (verdict === "hold" || verdict === "hold_moderate") return "wealthDetail.verdict.hold";
  if (verdict === "wait") return "wealthDetail.verdict.wait";
  if (verdict === "review") return "wealthDetail.verdict.review";
  return "wealthDetail.verdict.neutral";
}

export default function Verdict({ t, verdict, reasonKey, reasonParams = undefined }) {
  const reason = reasonKey ? t(reasonKey, reasonParams) : "";
  return (
    <div className="ed-asset-verdict">
      <span className={`ed-asset-verdict-pill ${verdictPillClass(verdict)}`}>{t(verdictLabelKey(verdict))}</span>
      {reason ? <span className="ed-asset-verdict-reason">{reason}</span> : null}
    </div>
  );
}
