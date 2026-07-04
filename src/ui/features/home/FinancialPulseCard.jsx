import { useMemo, useState } from "react";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { usePrivacyAmount } from "../../../hooks/usePrivacyAmount.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { showSalariedStabilityCards } from "../../../constants/modeExperience.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { shareOrCopyPlainText } from "../../../utils/shareText.js";
import { openLifeScoreShareCard } from "../../../utils/lifeShareCards.js";
import { Badge } from "../../primitives/Badge.jsx";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { TabContent } from "../../patterns/TabContent.jsx";
import { PressureRing } from "../../patterns/PressureRing.jsx";
import { MetricOwnerLink } from "../../patterns/MetricOwnerLink.jsx";
import { insightToneClass } from "../../tokens/severity.js";
import { Heading, Caption } from "../../primitives/Text.jsx";
import { ConceptHelp } from "../../guidance/ConceptHelp.jsx";
import { WhyInsightPanel } from "../../guidance/WhyInsightPanel.jsx";
import { pickMicroTip } from "../../../guidance/index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { joinEngineMessages, translatePressureLabel } from "../../../i18n/engineLabels.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { tierHasFeature, aheadForecastMonthsForTier } from "../../../utils/tierAccess.js";
import { pressureTone } from "../../utils/statusColor.js";

function mergeTips(intel, stable, settings, serverTier = null) {
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
  if (tierHasFeature("lifestyle_inflation", settings, serverTier) && stable.lifestyle?.messageKey) {
    add({ id: "lifestyle-inflation", tone: "info", key: stable.lifestyle.messageKey, params: stable.lifestyle.params });
  } else if (tierHasFeature("lifestyle_inflation", settings, serverTier) && stable.lifestyle?.message) {
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
  if (tierHasFeature("advanced_pressure", settings, serverTier) && stable.pressureIntel?.forecastMessageKey) {
    add({
      id: "pressure-forecast",
      tone: "info",
      key: stable.pressureIntel.forecastMessageKey,
      params: stable.pressureIntel.forecastMessageParams,
    });
  }
  return out;
}

/** One card with Summary / Pressure / Tips — Analytics financial pulse. */
export default function FinancialPulseCard({ microTipSeed = 0, embedded = false }) {
  const { t } = useTranslation();
  const { formatAmount } = usePrivacyAmount();
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const { settings, effectiveSubscriptionTier } = usePerovo();
  const microTipKey = pickMicroTip(microTipSeed);
  const showPressure = showSalariedStabilityCards(settings);
  const ahead = stable.ahead;

  const tips = useMemo(
    () => mergeTips(intel, stable, settings, effectiveSubscriptionTier),
    [intel, stable, settings, effectiveSubscriptionTier],
  );
  const stress = stable.stress;
  const emergency = stable.emergency;
  const payoffRec = intel.payoffRec;
  const narrative = stable.healthNarrative;
  const pressureIntel = stable.pressureIntel;
  const advancedPressure = tierHasFeature("advanced_pressure", settings, effectiveSubscriptionTier);
  const aheadForecastLimit = aheadForecastMonthsForTier(settings, effectiveSubscriptionTier);

  const tabDefs = useMemo(() => {
    const base = [
      { id: "snapshot", label: t("pulse.tabSummary") },
      { id: "pressure", label: t("pulse.tabPressure") },
      { id: "tips", label: t("pulse.tabTips") },
    ];
    if (!ahead) return base;
    return [base[0], { id: "ahead", label: t("pulse.tabAhead") }, ...base.slice(1)];
  }, [ahead, t]);

  const defaultTab = showPressure && stress?.top?.length ? "pressure" : "snapshot";
  const [tab, setTab] = useState(defaultTab);
  const [shareHint, setShareHint] = useState("");

  const visibleTabs = tabDefs.filter((t) => t.id !== "pressure" || showPressure);

  return (
    <section className="ed-pulse-card">
      <div
        className={embedded ? undefined : "ed-pulse-row-between"}
        style={
          embedded
            ? { display: "flex", justifyContent: "flex-end", flexWrap: "wrap", alignItems: "flex-start" }
            : undefined
        }
      >
        {!embedded ? (
          <Heading level={2}>
            {t("pulse.title")}
            <ConceptHelp conceptId="stability" />
          </Heading>
        ) : null}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          <SegmentedControl options={visibleTabs} value={tab} onChange={setTab} />
        </div>
      </div>

      <TabContent tabId="snapshot" activeTab={tab}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
          <Caption className="block ed-guidance-micro">{t(microTipKey)}</Caption>

          {narrative && (narrative.strengths.length > 0 || narrative.weaknesses.length > 0) && (
            <div className="ed-insight-accent" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {narrative.strengths.length > 0 && (
                <Caption className="block">
                  <span className="ed-text-success" style={{ fontWeight: 600 }}>{t("pulse.strengths")} </span>
                  {joinEngineMessages(t, narrative.strengths)}
                </Caption>
              )}
              {narrative.weaknesses.length > 0 && (
                <Caption className="block">
                  <span className="ed-text-warning" style={{ fontWeight: 600 }}>{t("pulse.watch")} </span>
                  {joinEngineMessages(t, narrative.weaknesses)}
                </Caption>
              )}
            </div>
          )}

          <div className="ed-pulse-row-between" data-guide="pressure-score">
            <div>
              <Caption className="inline-flex items-center">
                {t("pulse.pressure")}
                <InfoTip text={CALC_HELP.pressureScore} />
              </Caption>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
              <button
                type="button"
                className="ed-link ed-link--xs"
                onClick={async () => {
                  const data = {
                    healthScore: intel.health?.score,
                    healthLabel: intel.health?.label,
                    pressureScore: intel.stability.score,
                    pressureLabel: intel.stability.label,
                    survivalMonths: stable.survival?.survivalMonths,
                    survivalLabel: stable.survival?.tierLabel,
                    displayName: settings.displayName || t("brand.defaultUser"),
                  };
                  openLifeScoreShareCard(data);
                }}
              >
                {t("pulse.shareSummary")}
              </button>
              <Badge tone={pressureTone(intel.stability.score) || intel.stability.tone}>
                {translatePressureLabel(t, pressureIntel?.emotionalLabel || intel.stability.label)}
              </Badge>
              <PressureRing score={intel.stability.score ?? 0} size={72} variant="conic" />
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

          {stable.survival?.scenarios ? (
            <div className="ed-inset" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <MetricOwnerLink label={t("tier.survival.title")} to="/insights" />
              {[
                { key: "baseline", label: t("tier.survival.baseline"), data: stable.survival.scenarios.baseline, fill: "" },
                { key: "stressed", label: t("tier.survival.stressed"), data: stable.survival.scenarios.stressed, fill: "stressed" },
                { key: "critical", label: t("tier.survival.critical"), data: stable.survival.scenarios.critical, fill: "critical" },
              ].map((row) => {
                const months = row.data?.runwayMonths ?? 0;
                const pct = Math.min(100, (months / 12) * 100);
                return (
                  <div key={row.key} className="ed-survival-row">
                    <span className="ed-survival-label">{row.label}</span>
                    <div className="ed-survival-bar">
                      <div className={`ed-survival-fill ${row.fill}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="ed-survival-months">
                      {t("netWorth.liquidity.months", { count: months })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}

          {emergency && emergency.recommended > 0 && (
            <div className="ed-inset" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ed-ink)", display: "inline-flex", alignItems: "center" }}>
                {t("pulse.emergencyReserve")}
                <InfoTip text={CALC_HELP.emergencyReserve} />
              </p>
              <Caption className="block">{t(emergency.messageKey)}</Caption>
              <div className="ed-progress-track">
                <div
                  className="ed-progress-fill ed-bar-animated"
                  style={{ width: `${Math.min(100, emergency.progressPercent)}%` }}
                />
              </div>
            </div>
          )}

        </div>
      </TabContent>

      {ahead ? (
        <TabContent tabId="ahead" activeTab={tab}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
          <div className="ed-pulse-row-between">
            <Caption className="block">{t("pulse.aheadIntro")}</Caption>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" className="ed-link ed-link--xs" onClick={async () => {
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
                <span className="ed-text-success" style={{ fontSize: 11, fontWeight: 500 }}>{shareHint}</span>
              ) : null}
            </div>
          </div>

          {ahead.dueWeeks?.length > 0 && (
            <div>
              <Caption className="block font-semibold mb-2">{t("pulse.dueNextWeeks")}</Caption>
              <div className="ed-grid-4">
                {ahead.dueWeeks.map((w) => (
                  <div
                    key={w.week ?? w.label}
                    className="ed-inset"
                    style={{ fontSize: 12 }}
                  >
                    <p className="font-semibold">{w.label || t("pulse.weekN", { n: (w.week ?? 0) + 1 })}</p>
                    <Caption className="block mt-0.5">{formatAmount(w.amount || 0)}</Caption>
                    {w.items?.length > 0 && (
                      <ul style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 11, opacity: 0.8, overflow: "hidden", marginTop: 4, listStyle: "none", padding: 0 }}>
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
              <Caption className="block font-semibold mb-1">{t("pulse.nextMonths")}</Caption>
              <ul style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, listStyle: "none", padding: 0, margin: 0 }}>
                {ahead.forecastMonths.slice(0, aheadForecastLimit).map((m) => (
                  <li key={m.monthKey || m.month} className="flex justify-between gap-2">
                    <span>{m.month}</span>
                    <span className="shrink-0">
                      {t("pulse.dueFree", { due: formatAmount(m.due), free: formatAmount(m.free) })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ahead.heavyMonths?.length > 0 && (
            <p className="ed-insight-violet">
              {t("pulse.highestObligations", {
                month: ahead.heavyMonths[0].month,
                due: formatAmount(ahead.heavyMonths[0].due),
              })}
            </p>
          )}

          {ahead.goalCapacity?.length > 0 && (
            <div>
              <Caption className="block font-semibold mb-1">{t("pulse.goalsVsFreeCash")}</Caption>
              <ul style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, listStyle: "none", padding: 0, margin: 0 }}>
                {ahead.goalCapacity.slice(0, 5).map((g) => (
                  <li key={g.id} className="flex justify-between gap-2">
                    <span className="truncate">{g.name}</span>
                    <span className={`shrink-0 ${g.feasible ? "ed-text-success" : "ed-text-warning"}`}>
                      {formatAmount(g.neededPerMonth)}/mo
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ahead.billPriority?.plan?.length > 0 && (
            <div>
              <Caption className="block font-semibold mb-1">
                {ahead.billPriority.coversAll
                  ? t("pulse.suggestedPayOrder")
                  : t("pulse.suggestedPayOrderShort", { amount: formatAmount(ahead.billPriority.shortfall) })}
              </Caption>
              <ol style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, listStyle: "decimal", paddingLeft: 20, margin: 0 }}>
                {ahead.billPriority.plan.map((row) => (
                  <li key={row.id}>
                    {row.name}{" "}
                    <span className={row.canPay ? "ed-text-success" : "ed-text-warning"}>
                      ({formatAmount(row.amount)}
                      {row.canPay ? ` — ${t("pulse.withinFreeCash")}` : ` — ${t("pulse.exceedsFreeCash")}`})
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {ahead.creditCard?.insights?.length > 0 && (
            <div className="ed-insight-danger" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ed-red)" }}>{t("pulse.creditCards")}</p>
              {ahead.creditCard.insights.map((line, i) => (
                <p key={i} style={{ fontSize: 12, color: "var(--ed-ink-soft)" }}>
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
        </TabContent>
      ) : null}

      <TabContent tabId="pressure" activeTab={tab}>
        {showPressure ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Caption className="block">
            {t("pulse.mainPressure")}
            <InfoTip text={CALC_HELP.pressureWeight} />
          </Caption>

          {stress?.top?.length ? (
            <>
              <Caption className="block font-medium">{t("pulse.mainPressureList")}</Caption>
              <ol style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "decimal", paddingLeft: 20, margin: 0 }}>
                {stress.top.map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {i + 1}. {r.name}
                      <span className="ed-caption" style={{ opacity: 0.75, marginLeft: 4, fontSize: 12 }}>({r.category})</span>
                    </span>
                    <span className="font-semibold shrink-0">{formatAmount(Math.round(r.weight))}/mo</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <Caption className="block">{t("pulse.noActiveBills")}</Caption>
          )}

          {advancedPressure && pressureIntel?.forecastMessageKey && (
            <p className="ed-insight-violet">
              {t(pressureIntel.forecastMessageKey, pressureIntel.forecastMessageParams || {})}
            </p>
          )}

          {intel.transactionRhythmNote && (
            <p className="ed-insight-violet">{translateInsight(t, intel.transactionRhythmNote)}</p>
          )}

          {payoffRec && (
            <p className="ed-insight-accent">
              <span className="font-semibold">{t("pulse.focusFirst")}</span> {payoffRec.name}
            </p>
          )}
        </div>
        ) : null}
      </TabContent>

      <TabContent tabId="tips" activeTab={tab}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tips.length === 0 ? (
            <Caption className="block">{t("pulse.noTips")}</Caption>
          ) : (
            <ul style={{ display: "flex", flexDirection: "column", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
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
      </TabContent>
    </section>
  );
}
