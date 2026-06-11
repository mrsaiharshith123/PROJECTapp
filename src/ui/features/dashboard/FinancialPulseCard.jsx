import { useMemo, useRef, useState } from "react";
import { useNumericChange } from "../../hooks/useNumericChange.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { showSalariedStabilityCards, isSalariedFamily } from "../../../constants/modeExperience.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { lifeScoreSharePlainText, openLifeScoreShareCard } from "../../../utils/lifeShareCards.js";
import { Card } from "../../primitives/Card.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { insightToneClass } from "../../tokens/severity.js";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { Surface } from "../../primitives/Surface.jsx";
import { ConceptHelp } from "../../guidance/ConceptHelp.jsx";
import { WhyInsightPanel } from "../../guidance/WhyInsightPanel.jsx";
import { pickMicroTip } from "../../../guidance/index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { joinEngineMessages, translatePressureLabel } from "../../../i18n/engineLabels.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { tierHasFeature, aheadForecastMonthsForTier } from "../../../utils/tierAccess.js";

function mergeTips(intel, stable, settings) {
  const seenIds = new Set();
  const seenText = new Set();
  const out = [];
  const add = (item) => {
    const text = String(item?.text || "").trim();
    if (!text) return;
    const textKey = text.toLowerCase();
    if (seenIds.has(item.id) || seenText.has(textKey)) return;
    seenIds.add(item.id);
    seenText.add(textKey);
    out.push(item);
  };

  const skip = new Set(["stress-contributors", "emi-pct"]);
  for (const ins of intel.insights) {
    if (skip.has(ins.id)) continue;
    add(ins);
  }
  for (const ins of stable.stabilityInsights || []) {
    if (skip.has(ins.id)) continue;
    if (ins.key) add({ id: ins.id, tone: ins.tone, key: ins.key, params: ins.params });
    else add(ins);
  }
  for (const f of intel.forecast || []) {
    add({ id: f.id, tone: f.tone || "info", params: f.params });
  }
  if (tierHasFeature("subscription_leak", settings)) {
    (intel.subscriptionLeak?.insights || []).forEach((item) => add(item));
  }
  if (tierHasFeature("lifestyle_inflation", settings) && stable.lifestyle?.messageKey) {
    add({ id: "lifestyle-inflation", tone: "info", key: stable.lifestyle.messageKey, params: stable.lifestyle.params });
  } else if (tierHasFeature("lifestyle_inflation", settings) && stable.lifestyle?.message) {
    add({ id: "lifestyle-inflation", tone: "info", text: stable.lifestyle.message });
  }
  if (stable.goalBalance?.messageKey) {
    add({
      id: "goal-balance",
      tone: "warning",
      key: stable.goalBalance.messageKey,
      params: stable.goalBalance.messageParams,
    });
  }
  if (tierHasFeature("advanced_pressure", settings) && stable.pressureIntel?.forecastMessageKey) {
    add({
      id: "pressure-forecast",
      tone: "info",
      key: stable.pressureIntel.forecastMessageKey,
      params: stable.pressureIntel.forecastMessageParams,
    });
  }
  return out;
}

/** One card with Summary / Pressure / Tips — replaces stacked insight sections on Home. */
export default function FinancialPulseCard({ microTipSeed = 0 }) {
  const { t } = useTranslation();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const { settings } = useCommitTrack();
  const microTipKey = pickMicroTip(microTipSeed);
  const showPressure = showSalariedStabilityCards(settings);
  const isFamily = isSalariedFamily(settings);
  const ahead = stable.ahead;

  const tips = useMemo(() => mergeTips(intel, stable, settings), [intel, stable, settings]);
  const stress = stable.stress;
  const emergency = stable.emergency;
  const payoffRec = intel.payoffRec;
  const narrative = stable.healthNarrative;
  const pressureIntel = stable.pressureIntel;
  const family = stable.family;
  const advancedPressure = tierHasFeature("advanced_pressure", settings);
  const aheadForecastLimit = aheadForecastMonthsForTier(settings);

  const tabDefs = useMemo(() => {
    const base = [
      { id: "snapshot", label: t("pulse.tabSummary") },
      { id: "pressure", label: t("pulse.tabPressure") },
      { id: "tips", label: t("pulse.tabTips") },
    ];
    if (!ahead) return base;
    return [base[0], { id: "ahead", label: t("pulse.tabAhead") }, ...base.slice(1)];
  }, [ahead, t]);

  const defaultTab = showPressure && (stress?.top?.length || family?.grouped) ? "pressure" : "snapshot";
  const [tab, setTab] = useState(defaultTab);
  const [shareHint, setShareHint] = useState("");
  const scoreRef = useRef(null);
  useNumericChange(intel.stability.score, scoreRef);

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
          {t("pulse.title")}
          <ConceptHelp conceptId="stability" />
        </Heading>
        <SegmentedControl options={visibleTabs} value={tab} onChange={setTab} />
      </div>

      {tab === "snapshot" && (
        <div className="ct-stack text-sm">
          <Caption className="block ct-guidance-micro">{t(microTipKey)}</Caption>

          {narrative && (narrative.strengths.length > 0 || narrative.weaknesses.length > 0) && (
            <div className="ct-insight-accent ct-stack-sm">
              {narrative.strengths.length > 0 && (
                <Caption className="block">
                  <span className="ct-text-success font-semibold">{t("pulse.strengths")} </span>
                  {joinEngineMessages(t, narrative.strengths)}
                </Caption>
              )}
              {narrative.weaknesses.length > 0 && (
                <Caption className="block">
                  <span className="ct-text-warning font-semibold">{t("pulse.watch")} </span>
                  {joinEngineMessages(t, narrative.weaknesses)}
                </Caption>
              )}
            </div>
          )}

          <div className="ct-row-between gap-2" style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <Caption className="inline-flex items-center">
                {t("pulse.pressure")}
                <InfoTip text={CALC_HELP.pressureScore} />
              </Caption>
              <Caption className="block mt-0.5 opacity-80">{t("pulse.pressureHint")}</Caption>
            </div>
            <div className="ct-stack-sm items-end shrink-0">
              <button
                type="button"
                className="ct-link !text-xs"
                onClick={async () => {
                  const data = {
                    healthScore: intel.health?.score,
                    healthLabel: intel.health?.label,
                    pressureScore: intel.stability.score,
                    pressureLabel: intel.stability.label,
                    survivalMonths: stable.survival?.survivalMonths,
                    survivalLabel: stable.survival?.tierLabel,
                    displayName: settings.displayName || "CommitTrack user",
                  };
                  await shareOrCopyPlainText(lifeScoreSharePlainText(data), { title: "Financial Life" });
                  openLifeScoreShareCard(data);
                }}
              >
                {t("pulse.shareSummary")}
              </button>
              <Badge tone={intel.stability.tone}>
                {translatePressureLabel(t, pressureIntel?.emotionalLabel || intel.stability.label)}
              </Badge>
              <Caption className="ct-numeral block opacity-80">
                <span ref={scoreRef}>{intel.stability.score}</span>/100
              </Caption>
            </div>
          </div>
          {advancedPressure && pressureIntel?.emotionalHintKey && (
            <Caption className="block italic">{t(pressureIntel.emotionalHintKey)}</Caption>
          )}
          {advancedPressure && pressureIntel?.trendMessageKey && (
            <Caption className="block">
              {t(pressureIntel.trendMessageKey, pressureIntel.trendMessageParams || {})}
            </Caption>
          )}

          {emergency && emergency.recommended > 0 && (
            <Surface className="ct-stack-sm">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 inline-flex items-center">
                {t("pulse.emergencyReserve")}
                <InfoTip text={CALC_HELP.emergencyReserve} />
              </p>
              <p className="text-xs text-gray-500">{t(emergency.messageKey)}</p>
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
              {t("pulse.aheadIntro")}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="ct-link !text-xs"
                onClick={async () => {
                  const text = ahead.shareSummary || "";
                  const r = await shareOrCopyPlainText(text, { title: t("pulse.shareTitle") });
                  if (r.method === "share") setShareHint(t("pulse.shared"));
                  else if (r.method === "clipboard") setShareHint(t("pulse.copied"));
                  else setShareHint("");
                  if (r.ok) setTimeout(() => setShareHint(""), 2500);
                }}
              >
                {t("pulse.shareSummary")}
              </button>
              {shareHint ? (
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">{shareHint}</span>
              ) : null}
            </div>
          </div>

          {ahead.dueWeeks?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-2">{t("pulse.dueNextWeeks")}</p>
              <div className="ct-grid-4">
                {ahead.dueWeeks.map((w) => (
                  <div
                    key={w.week ?? w.label}
                    className="ct-inset p-2 text-xs"
                  >
                    <p className="font-semibold text-gray-800 dark:text-slate-100">{w.label || t("pulse.weekN", { n: (w.week ?? 0) + 1 })}</p>
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
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">{t("pulse.nextMonths")}</p>
              <ul className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
                {ahead.forecastMonths.slice(0, aheadForecastLimit).map((m) => (
                  <li key={m.monthKey || m.month} className="flex justify-between gap-2">
                    <span>{m.month}</span>
                    <span className="shrink-0">
                      {t("pulse.dueFree", { due: formatInr(m.due), free: formatInr(m.free) })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isFamily && ahead.familyCalendar?.heavyMonths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">{t("pulse.householdHeavy")}</p>
              <ul className="space-y-1">
                {ahead.familyCalendar.heavyMonths.map((m) => (
                  <li
                    key={m.monthKey}
                    className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 px-2 py-1.5 text-amber-900 dark:text-amber-100"
                  >
                    {t("pulse.heavyDue", { label: m.label, amount: formatInr(m.amount) })}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isFamily && family?.heavyRenewals?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">{t("pulse.largeRenewals")}</p>
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
              {t("pulse.highestObligations", {
                month: ahead.heavyMonths[0].month,
                due: formatInr(ahead.heavyMonths[0].due),
              })}
            </p>
          )}

          {ahead.goalCapacity?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">{t("pulse.goalsVsFreeCash")}</p>
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
                {ahead.billPriority.coversAll
                  ? t("pulse.suggestedPayOrder")
                  : t("pulse.suggestedPayOrderShort", { amount: formatInr(ahead.billPriority.shortfall) })}
              </p>
              <ol className="space-y-1 text-xs text-gray-600 dark:text-slate-300 list-decimal list-inside">
                {ahead.billPriority.plan.map((row) => (
                  <li key={row.id}>
                    {row.name}{" "}
                    <span className={row.canPay ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200"}>
                      ({formatInr(row.amount)}
                      {row.canPay ? ` — ${t("pulse.withinFreeCash")}` : ` — ${t("pulse.exceedsFreeCash")}`})
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {ahead.creditCard?.insights?.length > 0 && (
            <div className="ct-insight-danger ct-stack-sm">
              <p className="text-xs font-semibold text-rose-900 dark:text-rose-100">{t("pulse.creditCards")}</p>
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
            {isFamily ? t("pulse.householdPressure") : t("pulse.mainPressure")}
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
              <p className="text-xs font-medium text-gray-700 dark:text-slate-200">{t("pulse.mainPressureList")}</p>
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
            <p className="text-sm text-gray-500">{t("pulse.noActiveBills")}</p>
          )}

          {advancedPressure && pressureIntel?.forecastMessageKey && (
            <p className="ct-insight-violet">
              {t(pressureIntel.forecastMessageKey, pressureIntel.forecastMessageParams || {})}
            </p>
          )}

          {intel.transactionRhythmNote && (
            <p className="ct-insight-violet">{translateInsight(t, intel.transactionRhythmNote)}</p>
          )}

          {!isFamily && payoffRec && (
            <p className="ct-insight-accent">
              <span className="font-semibold">{t("pulse.focusFirst")}</span> {payoffRec.name}
            </p>
          )}
        </div>
      )}

      {tab === "tips" && (
        <div className="ct-stack-sm">
          {tips.length === 0 ? (
            <p className="text-sm text-gray-500">{t("pulse.noTips")}</p>
          ) : (
            <ul className="space-y-2">
              {tips.slice(0, 10).map((ins) => (
                <li key={ins.id} className={`text-sm rounded-lg px-3 py-2 border ${insightToneClass(ins.tone)}`}>
                  <p>{translateInsight(t, ins)}</p>
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
