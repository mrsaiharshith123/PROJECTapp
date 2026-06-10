import { useMemo, useState } from "react";
import { computeEmergencyFundIntel } from "../../../engines/emergencyFund.js";
import { totalMonthlyBurden } from "../../../engines/burden.js";
import { analyzeSipPlan } from "../../../engines/sipAdvisor.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { formatInr } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body, Heading } from "../../primitives/Text.jsx";
import { ProgressBar } from "../../patterns/ProgressBar.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { ProGate } from "../../patterns/ProGate.jsx";

function EmergencyFundTab() {
  const { t } = useTranslation();
  const { settings, commitments, getEffectiveStatus, updateSettings } = useCommitTrack();
  const intel = useCommitIntel();
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);

  const emergency = useMemo(
    () =>
      computeEmergencyFundIntel({
        monthlyBurden: burden,
        liquidSavings: settings.liquidSavings,
        dependents: settings.dependents,
        pressureScore: intel.stability?.score ?? 50,
      }),
    [burden, settings.liquidSavings, settings.dependents, intel.stability?.score],
  );

  return (
    <div className="ct-stack">
      <Caption>{t("tools.emergency.intro")}</Caption>
      <div>
        <label className="ct-metric-label block">{t("tools.emergency.liquidSavings")}</label>
        <input
          className="ct-input mt-1"
          value={settings.liquidSavings === 0 ? "" : String(settings.liquidSavings)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            updateSettings({ liquidSavings: raw === "" ? 0 : Math.max(0, Number(raw) || 0) });
          }}
          inputMode="numeric"
        />
      </div>
      <div className="ct-inset ct-stack-sm">
        <Heading level={3} className="!text-base">
          {t("tools.emergency.target", {
            amount: formatInr(emergency.recommended),
            months: emergency.recommendedMonths,
          })}
        </Heading>
        <Body className="!text-sm">
          {t("tools.emergency.current", { amount: formatInr(emergency.current) })}
        </Body>
        {emergency.gap > 0 && (
          <Caption className="block">{t("tools.emergency.gap", { amount: formatInr(emergency.gap) })}</Caption>
        )}
        <ProgressBar value={emergency.progressPercent} />
        <Caption className="block">{translateInsight(t, { key: emergency.messageKey })}</Caption>
      </div>
    </div>
  );
}

function SipAdvisorTab() {
  const { t } = useTranslation();
  const intel = useCommitIntel();
  const { commitments } = useCommitTrack();
  const [sip, setSip] = useState("");
  const [years, setYears] = useState("10");
  const [target, setTarget] = useState("");
  const [rate, setRate] = useState("12");

  const sipFromBills = useMemo(() => {
    return commitments
      .filter((c) => c.category === "SIP")
      .reduce((s, c) => s + Math.max(0, Number(c.amount) || 0), 0);
  }, [commitments]);

  const plan = useMemo(
    () =>
      analyzeSipPlan({
        monthlySip: Number(sip) || sipFromBills || 0,
        years: Number(years) || 10,
        targetAmount: Number(target) || 0,
        annualReturn: (Number(rate) || 12) / 100,
        monthlyFreeCash: intel.stability?.freeMoney ?? 0,
      }),
    [sip, years, target, rate, sipFromBills, intel.stability?.freeMoney],
  );

  return (
    <div className="ct-stack">
      <Caption>{t("tools.sip.intro")}</Caption>
      {sipFromBills > 0 && (
        <Caption className="block">{t("tools.sip.fromBills", { amount: formatInr(sipFromBills) })}</Caption>
      )}
      <div>
        <label className="ct-metric-label block">{t("tools.sip.monthly")}</label>
        <input
          className="ct-input mt-1"
          value={sip}
          onChange={(e) => setSip(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={sipFromBills ? String(sipFromBills) : "5000"}
          inputMode="numeric"
        />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.sip.years")}</label>
        <input className="ct-input mt-1" value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.sip.target")}</label>
        <input className="ct-input mt-1" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.sip.return")}</label>
        <input className="ct-input mt-1" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ct-inset ct-stack-sm">
        <Heading level={3} className="!text-base">
          {t("tools.sip.projected", { amount: formatInr(plan.projectedCorpus) })}
        </Heading>
        {plan.narrativeLines.map((line) => (
          <Caption key={line} className="block">
            {line}
          </Caption>
        ))}
      </div>
    </div>
  );
}

export default function SafetyPlannerPanel() {
  const { t } = useTranslation();
  const tabs = useMemo(
    () => [
      { id: "emergency", label: t("tools.safety.tabEmergency") },
      { id: "sip", label: t("tools.safety.tabSip") },
    ],
    [t],
  );
  const [tab, setTab] = useState("emergency");

  return (
    <div className="ct-stack">
      <Caption>{t("tools.safety.intro")}</Caption>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "emergency" && <EmergencyFundTab />}
      {tab === "sip" && (
        <ProGate featureId="sip_advisor">
          <SipAdvisorTab />
        </ProGate>
      )}
    </div>
  );
}
