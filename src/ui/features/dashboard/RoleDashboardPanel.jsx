import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { getUserModeConfig } from "../../../constants/userModes.js";
import { COPY } from "../../../constants/copy.js";
import { Card } from "../../primitives/Card.jsx";
import { Caption } from "../../primitives/Text.jsx";

function Metric({ label, value, sub, tone = "default" }) {
  const valueClass =
    tone === "good"
      ? "ct-metric-value-success"
      : tone === "warn"
        ? "ct-hero-metric-warn"
        : tone === "accent"
          ? "ct-metric-value-accent"
          : "";
  return (
    <div className="ct-metric text-left min-w-0">
      <Caption className="font-semibold uppercase block">{label}</Caption>
      <p className={`ct-metric-value mt-0.5 truncate ${valueClass}`.trim()}>{value}</p>
      {sub && <Caption className="mt-0.5 block leading-snug">{sub}</Caption>}
    </div>
  );
}

function buildModePanel(mode, ctx) {
  const { settings, lendings, commitments, getEffectiveStatus, intel, cfg, family, familyCalendar } = ctx;
  const receivables = lendings.filter((l) => l.type === "lent" && Number(l.remainingAmount) > 0);
  const payables = lendings.filter((l) => l.type === "borrowed" && Number(l.remainingAmount) > 0);
  const burden = Math.round(intel.stability.monthlyBurden);
  const free = Math.round(intel.stability.freeMoney);

  if (mode === "business") {
    return {
      title: "Business cashflow",
      subtitle: "Receivables, payables & pressure",
      emoji: "≡ƒÅ¬",
      metrics: [
        {
          label: "Receivables",
          value: `Γé╣${receivables.reduce((s, l) => s + Number(l.remainingAmount), 0).toLocaleString()}`,
          sub: `${receivables.length} open`,
          tone: "good",
        },
        {
          label: "Payables",
          value: `Γé╣${payables.reduce((s, l) => s + Number(l.remainingAmount), 0).toLocaleString()}`,
          sub: `${payables.length} due`,
          tone: "warn",
        },
        {
          label: "Pressure",
          value: `${intel.stability.score}`,
          sub: intel.stability.label,
          tone: "accent",
        },
        {
          label: "Monthly bills",
          value: `Γé╣${burden.toLocaleString()}`,
          sub: "Vendor & fixed costs",
          tone: "default",
        },
      ],
      tip: `Track vendor ${COPY.bills} under Bills and client loans under Lending.`,
    };
  }
  if (mode === "student") {
    const subs = commitments.filter(
      (c) => c.category === "Subscription" && getEffectiveStatus(c) !== "paid"
    );
    return {
      title: "Student budget",
      subtitle: "Keep subs and dues under control",
      emoji: "≡ƒÄô",
      metrics: [
        { label: "Subscriptions", value: String(subs.length), sub: "Active", tone: "accent" },
        {
          label: "Open balance",
          value: `Γé╣${Math.round(intel.openRemaining).toLocaleString()}`,
          sub: "Still to clear",
          tone: "warn",
        },
        {
          label: "Stability",
          value: `${intel.stability.score}`,
          sub: intel.stability.label,
          tone: "default",
        },
        {
          label: "Free cash",
          value: `Γé╣${free.toLocaleString()}`,
          sub: "After monthly bills",
          tone: free >= 0 ? "good" : "warn",
        },
      ],
      tip: intel.subscriptionLeak.insights[0] || intel.forecast[0]?.text || "Set a savings goal under Quick calculators on Home",
    };
  }
  if (mode === "family") {
    const fam = family;
    return {
      title: "Household view",
      subtitle: fam?.safetyLabel ? `Safety: ${fam.safetyLabel}` : `Profile: ${settings.activeProfileId || "default"}`,
      emoji: "≡ƒæ¿ΓÇì≡ƒæ⌐ΓÇì≡ƒæº",
      metrics: [
        {
          label: "Monthly bills",
          value: `Γé╣${burden.toLocaleString()}`,
          sub: fam?.committedPercent != null ? `${fam.committedPercent}% of income` : "Household burden",
          tone: fam?.committedPercent > 65 ? "warn" : "default",
        },
        {
          label: "Pressure",
          value: `${intel.stability.score}`,
          sub: intel.stability.label,
          tone: "accent",
        },
        {
          label: "Health",
          value: intel.health?.label || "ΓÇö",
          sub: `Score ${intel.health?.score ?? "ΓÇö"}`,
          tone: "good",
        },
        {
          label: "Free cash",
          value: `Γé╣${free.toLocaleString()}`,
          sub: "After bills",
          tone: free >= 0 ? "good" : "warn",
        },
      ],
      tip:
        fam?.insights?.[0]?.text ||
        familyCalendar?.insights?.[0]?.text ||
        "Add school fees and insurance in Bills for a sharper household calendar.",
    };
  }
  if (mode === "freelancer") {
    return {
      title: "Irregular income",
      subtitle: "Buffer and pending client pay",
      emoji: "≡ƒÄ»",
      metrics: [
        {
          label: "Buffer",
          value: `Γé╣${free.toLocaleString()}`,
          sub: "After monthly bills",
          tone: free >= 0 ? "good" : "warn",
        },
        {
          label: "Stability",
          value: `${intel.stability.score}`,
          sub: intel.stability.label,
          tone: "accent",
        },
        {
          label: "Client due",
          value: String(receivables.length),
          sub: receivables.length ? "Pending in Lending" : "Log in Lending",
          tone: "default",
        },
        {
          label: "Pressure",
          value: `${intel.health.score}`,
          sub: "Health score",
          tone: "default",
        },
      ],
      tip: intel.forecast[0]?.text || null,
    };
  }
  return {
    title: "Power overview",
    subtitle: cfg.description,
    emoji: "ΓÜí",
    metrics: [
      { label: "Pressure", value: `${intel.stability.score}`, sub: intel.stability.label, tone: "accent" },
      { label: "Health", value: `${intel.health.score}`, sub: intel.health.label, tone: "good" },
      { label: COPY.billsStat, value: String(commitments.length), sub: "Tracked", tone: "default" },
      { label: "Lending", value: String(lendings.length), sub: "Entries", tone: "default" },
    ],
    tip: null,
  };
}

/** Mode-specific highlights on Home ΓÇö extends existing dashboard, does not replace it. */
export default function RoleDashboardPanel() {
  const { settings, lendings, commitments, getEffectiveStatus } = useCommitTrack();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const mode = settings.userMode || "salaried";
  const cfg = getUserModeConfig(mode);
  const panel = buildModePanel(mode, {
    settings,
    lendings,
    commitments,
    getEffectiveStatus,
    intel,
    cfg,
    family: stable.family,
    familyCalendar: stable.familyCalendar,
  });

  return (
    <Card variant="hero" className="!pb-3">
      <div className="ct-row items-start gap-3 pb-3">
        <span className="text-2xl leading-none" aria-hidden>
          {panel.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="ct-h2">{panel.title}</h2>
          <Caption className="mt-0.5 block opacity-90">{panel.subtitle}</Caption>
        </div>
      </div>
      <div className="ct-grid-2 pb-2">
        {panel.metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>
      {panel.tip && <div className="ct-hero-inset ct-body !text-xs mx-1 mb-1">{panel.tip}</div>}
    </Card>
  );
}
