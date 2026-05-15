import Card from "../Card.jsx";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { getUserModeConfig } from "../../constants/userModes.js";

function buildModePanel(mode, ctx) {
  const { settings, lendings, commitments, getEffectiveStatus, intel, cfg } = ctx;
  const subs = commitments.filter(
    (c) => c.category === "Subscription" && getEffectiveStatus(c) !== "paid"
  );
  const emis = commitments.filter((c) => c.category === "EMI" && getEffectiveStatus(c) !== "paid");
  const receivables = lendings.filter((l) => l.type === "lent" && Number(l.remainingAmount) > 0);
  const payables = lendings.filter((l) => l.type === "borrowed" && Number(l.remainingAmount) > 0);

  if (mode === "salaried") {
    return {
      title: "Salaried focus",
      bullets: [
        `Monthly dues: ₹${Math.round(intel.stability.monthlyBurden).toLocaleString()} (${intel.stability.committedPercent ?? "—"}% of income)`,
        `Free after dues: ₹${Math.round(intel.stability.freeMoney).toLocaleString()}`,
        emis.length ? `${emis.length} open EMI(s) · ${subs.length} subscription(s)` : `${subs.length} active subscription(s)`,
        intel.payoffRec ? intel.payoffRec.message : "Add income in Profile for burden %",
      ],
    };
  }
  if (mode === "business") {
    return {
      title: "Business cashflow",
      bullets: [
        `Receivables outstanding: ₹${receivables.reduce((s, l) => s + Number(l.remainingAmount), 0).toLocaleString()}`,
        `Payables due: ₹${payables.reduce((s, l) => s + Number(l.remainingAmount), 0).toLocaleString()}`,
        `Pressure score: ${intel.stability.score}/100 · ${intel.stability.label}`,
        "Track vendor dues under Commitments and client loans under Lending.",
      ],
    };
  }
  if (mode === "student") {
    return {
      title: "Student budget",
      bullets: [
        `${subs.length} subscription(s) active`,
        intel.subscriptionLeak.insights[0] || "Review subscriptions on Home insights",
        `Open obligations: ₹${Math.round(intel.openRemaining).toLocaleString()}`,
        intel.forecast[0]?.text || "Set a savings goal in Tools",
      ],
    };
  }
  if (mode === "family") {
    return {
      title: "Household view",
      bullets: [
        `Profile: ${settings.activeProfileId || "default"} — switch in Profile`,
        `Shared burden est.: ₹${Math.round(intel.stability.monthlyBurden).toLocaleString()}/mo`,
        `${commitments.length} commitments in this profile`,
        intel.health ? `Household health: ${intel.health.label}` : "",
      ].filter(Boolean),
    };
  }
  if (mode === "freelancer") {
    return {
      title: "Irregular income",
      bullets: [
        `Buffer after dues: ₹${Math.round(intel.stability.freeMoney).toLocaleString()}`,
        intel.forecast[0]?.text || "Forecast updates as you add recurring items",
        `Stability: ${intel.stability.label} (${intel.stability.score}/100)`,
        receivables.length ? `${receivables.length} client payment(s) pending` : "Log client loans in Lending",
      ],
    };
  }
  return {
    title: "Power overview",
    bullets: [
      cfg.description,
      `Pressure ${intel.stability.score}/100 · Health ${intel.health.score}`,
      `${commitments.length} commitments · ${lendings.length} lending entries`,
    ],
  };
}

/** Mode-specific highlights on Home — extends existing dashboard, does not replace it. */
export default function RoleDashboardPanel() {
  const { settings, lendings, commitments, getEffectiveStatus } = useCommitTrack();
  const intel = useCommitIntel();
  const mode = settings.userMode || "salaried";
  const cfg = getUserModeConfig(mode);
  const { title, bullets } = buildModePanel(mode, {
    settings,
    lendings,
    commitments,
    getEffectiveStatus,
    intel,
    cfg,
  });

  return (
    <Card className="space-y-2 border-indigo-50 bg-white">
      <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      <ul className="space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-sm text-gray-600 leading-snug">
            {b}
          </li>
        ))}
      </ul>
    </Card>
  );
}
