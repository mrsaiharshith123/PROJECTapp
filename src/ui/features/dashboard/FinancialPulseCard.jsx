import { useMemo, useState } from "react";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { showSalariedStabilityCards, isSalariedFamily } from "../../../constants/modeExperience.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { Card } from "../../primitives/Card.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { insightToneClass } from "../../tokens/severity.js";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { Surface } from "../../primitives/Surface.jsx";
import { ConceptHelp } from "../../guidance/ConceptHelp.jsx";
import { WhyInsightPanel } from "../../guidance/WhyInsightPanel.jsx";
import { pickMicroTip } from "../../../guidance/index.js";

const BASE_TABS = [
  { id: "snapshot", label: "Summary" },
  { id: "pressure", label: "Pressure" },
  { id: "tips", label: "Tips" },
];

function mergeTips(intel, stable) {
  const seen = new Set();
  const out = [];
  const add = (item) => {
    if (!item?.text || seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
  };

  const skip = new Set(["stress-contributors", "emi-pct"]);
  for (const ins of intel.insights) {
    if (skip.has(ins.id)) continue;
    add(ins);
  }
  for (const ins of stable.stabilityInsights || []) {
    if (skip.has(ins.id)) continue;
    add(ins);
  }
  for (const f of intel.forecast || []) {
    add({ id: `forecast-${f.id}`, tone: "info", text: f.text });
  }
  (intel.subscriptionLeak?.insights || []).forEach((text, i) => {
    add({ id: `sub-leak-${i}`, tone: "warning", text });
  });
  if (stable.lifestyle?.message) {
    add({ id: "lifestyle-inflation", tone: "info", text: stable.lifestyle.message });
  }
  if (stable.goalBalance?.message && !(stable.stabilityInsights || []).some((i) => i.id === "goal-capacity")) {
    add({ id: "goal-balance", tone: "warning", text: stable.goalBalance.message });
  }
  if (stable.pressureIntel?.forecastMessage) {
    add({ id: "pressure-forecast", tone: "info", text: stable.pressureIntel.forecastMessage });
  }
  return out;
}

/** One card with Summary / Pressure / Tips — replaces stacked insight sections on Home. */
export default function FinancialPulseCard({ microTipSeed = 0 }) {
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const { settings } = useCommitTrack();
  const microTip = pickMicroTip(microTipSeed);
  const showPressure = showSalariedStabilityCards(settings);
  const isFamily = isSalariedFamily(settings);
  const ahead = stable.ahead;

  const tips = useMemo(() => mergeTips(intel, stable), [intel, stable]);
  const stress = stable.stress;
  const emergency = stable.emergency;
  const payoffRec = intel.payoffRec;
  const narrative = stable.healthNarrative;
  const pressureIntel = stable.pressureIntel;
  const family = stable.family;

  const tabDefs = useMemo(() => {
    if (!ahead) return BASE_TABS;
    return [BASE_TABS[0], { id: "ahead", label: "Ahead" }, ...BASE_TABS.slice(1)];
  }, [ahead]);

  const defaultTab = showPressure && (stress?.top?.length || family?.grouped) ? "pressure" : "snapshot";
  const [tab, setTab] = useState(defaultTab);
  const [shareHint, setShareHint] = useState("");

  const visibleTabs = tabDefs.filter((t) => t.id !== "pressure" || showPressure);

  const groupedEntries = family?.grouped
    ? Object.entries(family.grouped)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <Card className="ct-stack">
      <div className="ct-row-between" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
        <Heading level={2}>
          Financial pulse
          <ConceptHelp conceptId="stability" />
        </Heading>
        <SegmentedControl options={visibleTabs} value={tab} onChange={setTab} />
      </div>

      {tab === "snapshot" && (
        <div className="ct-stack text-sm">
          <Caption className="block ct-guidance-micro">{microTip}</Caption>

          {narrative && (narrative.strengths.length > 0 || narrative.weaknesses.length > 0) && (
            <div className="ct-insight-accent ct-stack-sm">
              {narrative.strengths.length > 0 && (
                <Caption className="block">
                  <span className="ct-text-success font-semibold">Strengths: </span>
                  {narrative.strengths.join(" · ")}
                </Caption>
              )}
              {narrative.weaknesses.length > 0 && (
                <Caption className="block">
                  <span className="ct-text-warning font-semibold">Watch: </span>
                  {narrative.weaknesses.join(" · ")}
                </Caption>
              )}
            </div>
          )}

          <div className="ct-row-between" style={{ flexWrap: "wrap" }}>
            <Caption className="inline-flex items-center">
              Pressure
              <InfoTip text={CALC_HELP.pressureScore} />
            </Caption>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${intel.stability.badgeClass}`}>
              {pressureIntel?.emotionalLabel || intel.stability.label} · {intel.stability.score}/100
            </span>
          </div>
          {pressureIntel?.emotionalHint && (
            <Caption className="block italic">{pressureIntel.emotionalHint}</Caption>
          )}
          {pressureIntel?.trendMessage && (
            <Caption className="block">{pressureIntel.trendMessage}</Caption>
          )}

          {emergency && emergency.recommended > 0 && (
            <Surface className="ct-stack-sm">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 inline-flex items-center">
                Emergency reserve
                <InfoTip text={CALC_HELP.emergencyReserve} />
              </p>
              <p className="text-xs text-gray-500">{emergency.message}</p>
              <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, emergency.progressPercent)}%` }}
                />
              </div>
            </Surface>
          )}

        </div>
      )}

      {tab === "ahead" && ahead && (
        <div className="ct-stack text-sm">
          <div className="ct-row-between" style={{ flexWrap: "wrap" }}>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Next ~4 weeks of dues, month forecast, and pay-order suggestions.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="ct-link !text-xs"
                onClick={async () => {
                  const text = ahead.shareSummary || "";
                  const r = await shareOrCopyPlainText(text, { title: "CommitTrack stability" });
                  if (r.method === "share") setShareHint("Shared");
                  else if (r.method === "clipboard") setShareHint("Copied");
                  else setShareHint("");
                  if (r.ok) setTimeout(() => setShareHint(""), 2500);
                }}
              >
                Share summary
              </button>
              {shareHint ? (
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">{shareHint}</span>
              ) : null}
            </div>
          </div>

          {ahead.dueWeeks?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-2">Due in next ~4 weeks</p>
              <div className="ct-grid-4">
                {ahead.dueWeeks.map((w) => (
                  <div
                    key={w.week ?? w.label}
                    className="ct-inset p-2 text-xs"
                  >
                    <p className="font-semibold text-gray-800 dark:text-slate-100">{w.label || `Week ${(w.week ?? 0) + 1}`}</p>
                    <p className="text-gray-600 dark:text-slate-400 mt-0.5">{formatInr(w.amount || 0)}</p>
                    {w.items?.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-[11px] text-gray-500 dark:text-slate-400 truncate">
                        {w.items.slice(0, 3).map((it) => (
                          <li key={`${it.name}-${it.dueDate}`} className="truncate" title={it.name}>
                            {it.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ahead.forecastMonths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Next months (dues vs free)</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
                {ahead.forecastMonths.slice(0, 6).map((m) => (
                  <li key={m.monthKey || m.month} className="flex justify-between gap-2">
                    <span>{m.month}</span>
                    <span className="shrink-0">
                      {formatInr(m.due)} due · {formatInr(m.free)} free
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isFamily && ahead.familyCalendar?.heavyMonths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Household heavy months</p>
              <ul className="space-y-1">
                {ahead.familyCalendar.heavyMonths.map((m) => (
                  <li
                    key={m.monthKey}
                    className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2 py-1.5 text-amber-900 dark:text-amber-100"
                  >
                    <span className="font-semibold">{m.label}</span> — ~{formatInr(m.amount)} due
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isFamily && family?.heavyRenewals?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Large renewals</p>
              <ul className="text-xs text-gray-600 dark:text-slate-300 space-y-0.5">
                {family.heavyRenewals.slice(0, 5).map((r) => (
                  <li key={`${r.name}-${r.dueDate}`}>
                    {r.name} — {formatInr(r.amount)}
                    {r.dueDate ? ` · ${r.dueDate}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ahead.heavyMonths?.length > 0 && (
            <p className="ct-insight-violet">
              Busiest stretch: {ahead.heavyMonths[0].month} (~{formatInr(ahead.heavyMonths[0].due)} due)
            </p>
          )}

          {ahead.goalCapacity?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Goals vs free cash</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
                {ahead.goalCapacity.slice(0, 5).map((g) => (
                  <li key={g.id} className="flex justify-between gap-2">
                    <span className="truncate">{g.name}</span>
                    <span className={`shrink-0 ${g.feasible ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200"}`}>
                      {formatInr(g.neededPerMonth)}/mo
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ahead.billPriority?.plan?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">
                Suggested pay order {ahead.billPriority.coversAll ? "" : `(short ~${formatInr(ahead.billPriority.shortfall)})`}
              </p>
              <ol className="space-y-1 text-xs text-gray-600 dark:text-slate-300 list-decimal list-inside">
                {ahead.billPriority.plan.map((row) => (
                  <li key={row.id}>
                    {row.name}{" "}
                    <span className={row.canPay ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200"}>
                      {`(${formatInr(row.amount)}${row.canPay ? " — fits free cash" : " — tight"})`}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {ahead.creditCard?.insights?.length > 0 && (
            <div className="ct-insight-danger ct-stack-sm">
              <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">Credit cards</p>
              {ahead.creditCard.insights.map((line, i) => (
                <p key={i} className="text-xs text-rose-900/90 dark:text-rose-100/90">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "pressure" && showPressure && (
        <div className="ct-stack">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {isFamily ? "Household pressure by category" : "Main pressure sources this month"}
            <InfoTip text={CALC_HELP.pressureWeight} />
          </p>

          {isFamily && groupedEntries.length > 0 ? (
            <ol className="space-y-2">
              {groupedEntries.map(([cat, amt], i) => (
                <li key={cat} className="flex justify-between gap-2 text-sm">
                  <span className="text-gray-700 dark:text-slate-300">
                    {i + 1}. {cat}
                  </span>
                  <span className="font-semibold shrink-0">{formatInr(Math.round(amt))}</span>
                </li>
              ))}
            </ol>
          ) : stress?.top?.length ? (
            <>
              <p className="text-xs font-medium text-gray-700 dark:text-slate-200">Main pressure sources:</p>
              <ol className="space-y-2">
                {stress.top.map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-700 dark:text-slate-300 truncate">
                      {i + 1}. {r.name}
                      <span className="text-gray-400 text-xs ml-1">({r.category})</span>
                    </span>
                    <span className="font-semibold shrink-0">{formatInr(Math.round(r.weight))}/mo</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-sm text-gray-500">No active bills yet. Add commitments to see pressure here.</p>
          )}

          {pressureIntel?.forecastMessage && (
            <p className="ct-insight-violet">
              {pressureIntel.forecastMessage}
            </p>
          )}

          {!isFamily && payoffRec && (
            <p className="ct-insight-accent">
              <span className="font-semibold">Focus first:</span> {payoffRec.name}
            </p>
          )}
        </div>
      )}

      {tab === "tips" && (
        <div className="ct-stack-sm">
          {tips.length === 0 ? (
            <p className="text-sm text-gray-500">No tips right now — you are in a calm stretch.</p>
          ) : (
            <ul className="space-y-2">
              {tips.slice(0, 10).map((ins) => (
                <li key={ins.id} className={`text-sm rounded-lg px-3 py-2 border ${insightToneClass(ins.tone)}`}>
                  <p>{ins.text}</p>
                  <WhyInsightPanel
                    insight={ins}
                    context={{
                      mode: settings.userMode,
                      overdueCount: stable.overdueCount,
                      stressTop: stress?.top,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
