import Card from "../Card.jsx";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { getUserModeConfig } from "../../constants/userModes.js";
import { COPY } from "../../constants/copy.js";

function Metric({ label, value, sub, tone = "default" }) {
  const tones = {
    default: "text-gray-900 dark:text-slate-100",
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    accent: "text-indigo-600 dark:text-indigo-400",
  };
  return (
    <div className="rounded-xl bg-white/80 dark:bg-slate-900/60 border border-indigo-100/80 dark:border-indigo-800/60 p-3 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500/90 dark:text-indigo-300/80">
        {label}
      </p>
      <p className={`text-xl font-bold mt-0.5 truncate ${tones[tone]}`} style={{ fontFamily: "'Sora', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">{sub}</p>}
    </div>
  );
}

function buildModePanel(mode, ctx) {
  const { settings, lendings, commitments, getEffectiveStatus, intel, cfg } = ctx;
  const subs = commitments.filter(
    (c) => c.category === "Subscription" && getEffectiveStatus(c) !== "paid"
  );
  const emis = commitments.filter((c) => c.category === "EMI" && getEffectiveStatus(c) !== "paid");
  const receivables = lendings.filter((l) => l.type === "lent" && Number(l.remainingAmount) > 0);
  const payables = lendings.filter((l) => l.type === "borrowed" && Number(l.remainingAmount) > 0);
  const burden = Math.round(intel.stability.monthlyBurden);
  const free = Math.round(intel.stability.freeMoney);
  const pct = intel.stability.committedPercent;

  if (mode === "salaried") {
    return {
      title: "Your paycheck snapshot",
      subtitle: "Quick read on salary vs monthly bills",
      emoji: "💼",
      metrics: [
        {
          label: "Monthly bills",
          value: `₹${burden.toLocaleString()}`,
          sub: pct != null ? `${pct}% of income` : "Add income in Profile",
          tone: pct != null && pct > 50 ? "warn" : "default",
        },
        {
          label: "Left after bills",
          value: `₹${free.toLocaleString()}`,
          sub: free >= 0 ? "Estimated free cash" : "Over-committed",
          tone: free >= 0 ? "good" : "warn",
        },
        {
          label: "EMIs open",
          value: String(emis.length),
          sub: emis.length ? "Tap Bills to pay down" : "None tracked",
          tone: "accent",
        },
        {
          label: "Subscriptions",
          value: String(subs.length),
          sub: subs.length ? "Review renewals" : "None active",
          tone: "accent",
        },
      ],
      tip: intel.payoffRec?.message || null,
    };
  }
  if (mode === "business") {
    return {
      title: "Business cashflow",
      subtitle: "Receivables, payables & pressure",
      emoji: "🏪",
      metrics: [
        {
          label: "Receivables",
          value: `₹${receivables.reduce((s, l) => s + Number(l.remainingAmount), 0).toLocaleString()}`,
          sub: `${receivables.length} open`,
          tone: "good",
        },
        {
          label: "Payables",
          value: `₹${payables.reduce((s, l) => s + Number(l.remainingAmount), 0).toLocaleString()}`,
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
          value: `₹${burden.toLocaleString()}`,
          sub: "Vendor & fixed costs",
          tone: "default",
        },
      ],
      tip: `Track vendor ${COPY.bills} under Bills and client loans under Lending.`,
    };
  }
  if (mode === "student") {
    return {
      title: "Student budget",
      subtitle: "Keep subs and dues under control",
      emoji: "🎓",
      metrics: [
        { label: "Subscriptions", value: String(subs.length), sub: "Active", tone: "accent" },
        {
          label: "Open balance",
          value: `₹${Math.round(intel.openRemaining).toLocaleString()}`,
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
          value: `₹${free.toLocaleString()}`,
          sub: "After monthly bills",
          tone: free >= 0 ? "good" : "warn",
        },
      ],
      tip: intel.subscriptionLeak.insights[0] || intel.forecast[0]?.text || "Set a savings goal under Quick calculators on Home",
    };
  }
  if (mode === "family") {
    return {
      title: "Household view",
      subtitle: `Profile: ${settings.activeProfileId || "default"}`,
      emoji: "👨‍👩‍👧",
      metrics: [
        {
          label: "Monthly bills",
          value: `₹${burden.toLocaleString()}`,
          sub: "Household burden est.",
          tone: "default",
        },
        { label: COPY.billsStat, value: String(commitments.length), sub: "In this profile", tone: "accent" },
        {
          label: "Health",
          value: intel.health?.label || "—",
          sub: `Score ${intel.health?.score ?? "—"}`,
          tone: "good",
        },
        {
          label: "Free cash",
          value: `₹${free.toLocaleString()}`,
          sub: "After bills",
          tone: "good",
        },
      ],
      tip: null,
    };
  }
  if (mode === "freelancer") {
    return {
      title: "Irregular income",
      subtitle: "Buffer and pending client pay",
      emoji: "🎯",
      metrics: [
        {
          label: "Buffer",
          value: `₹${free.toLocaleString()}`,
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
    emoji: "⚡",
    metrics: [
      { label: "Pressure", value: `${intel.stability.score}`, sub: intel.stability.label, tone: "accent" },
      { label: "Health", value: `${intel.health.score}`, sub: intel.health.label, tone: "good" },
      { label: COPY.billsStat, value: String(commitments.length), sub: "Tracked", tone: "default" },
      { label: "Lending", value: String(lendings.length), sub: "Entries", tone: "default" },
    ],
    tip: null,
  };
}

/** Mode-specific highlights on Home — extends existing dashboard, does not replace it. */
export default function RoleDashboardPanel() {
  const { settings, lendings, commitments, getEffectiveStatus } = useCommitTrack();
  const intel = useCommitIntel();
  const mode = settings.userMode || "salaried";
  const cfg = getUserModeConfig(mode);
  const panel = buildModePanel(mode, {
    settings,
    lendings,
    commitments,
    getEffectiveStatus,
    intel,
    cfg,
  });

  return (
    <Card className="overflow-hidden border-0 p-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-950/50">
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none" aria-hidden>
            {panel.emoji}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
              {panel.title}
            </h2>
            <p className="text-xs text-indigo-100/90 mt-0.5">{panel.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-3 pb-3 grid grid-cols-2 gap-2">
        {panel.metrics.map((m) => (
          <Metric key={m.label} {...m} />
        ))}
      </div>
      {panel.tip && (
        <p className="mx-3 mb-3 text-xs leading-relaxed text-indigo-50/95 bg-white/10 rounded-xl px-3 py-2 border border-white/10">
          {panel.tip}
        </p>
      )}
    </Card>
  );
}
