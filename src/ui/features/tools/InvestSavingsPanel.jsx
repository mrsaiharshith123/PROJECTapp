import { useMemo, useState } from "react";
import { analyzeSipPlan, buildSipCorpusSeries } from "../../../engines/sipAdvisor.js";
import { ToolComparisonChart } from "../../patterns/ToolComparisonChart.jsx";
import { computeFdRdProjection } from "../../../engines/fdRdTracker.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { formatInr } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { ProGate } from "../../patterns/ProGate.jsx";
import { Caption, Heading, Body } from "../../primitives/Text.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

function SipAdvisorTab() {
  const { t } = useTranslation();
  const intel = useCommitIntel();
  const { commitments } = useCommitTrack();
  const [sip, setSip] = useState("");
  const [sipBoost, setSipBoost] = useState("");
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

  const monthlySip = Number(sip) || sipFromBills || 0;
  const boostAmount = Number(sipBoost) || Math.round(monthlySip * 0.2);

  const corpusSeries = useMemo(
    () =>
      buildSipCorpusSeries({
        monthlySip,
        extraSip: boostAmount,
        years: Number(years) || 10,
        annualRate: (Number(rate) || 12) / 100,
      }).rows,
    [monthlySip, boostAmount, years, rate],
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
      <div>
        <label className="ct-metric-label block">{t("tools.sip.boostLabel")}</label>
        <input
          className="ct-input mt-1"
          value={sipBoost}
          onChange={(e) => setSipBoost(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={monthlySip > 0 ? String(Math.round(monthlySip * 0.2)) : "1000"}
          inputMode="numeric"
        />
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
      {monthlySip > 0 && (
        <ToolComparisonChart
          data={corpusSeries}
          titleKey="charts.sipCorpusTitle"
          baselineLabelKey="tools.sip.seriesCurrent"
          whatIfLabelKey="tools.sip.seriesIncreased"
        />
      )}
    </div>
  );
}

function FdRdTab() {
  const { t } = useTranslation();
  const [kind, setKind] = useState("fd");
  const [principal, setPrincipal] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [rate, setRate] = useState("7");
  const [tenure, setTenure] = useState("12");

  const projection = useMemo(
    () =>
      computeFdRdProjection({
        principal: Number(principal) || 0,
        annualRate: Number(rate) || 0,
        tenureMonths: Number(tenure) || 12,
        isRd: kind === "rd",
        monthlyDeposit: Number(monthlyDeposit) || 0,
      }),
    [principal, rate, tenure, kind, monthlyDeposit],
  );

  return (
    <div className="ct-stack">
      <Caption>{t("tier.fdrd.subtitle")}</Caption>
      <SegmentedControl
        options={[
          { id: "fd", label: t("tier.fdrd.fd") },
          { id: "rd", label: t("tier.fdrd.rd") },
        ]}
        value={kind}
        onChange={setKind}
      />
      {kind === "fd" ? (
        <div>
          <label className="ct-metric-label block">{t("tier.fdrd.principal")}</label>
          <input
            className="ct-input mt-1"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      ) : (
        <div>
          <label className="ct-metric-label block">{t("tier.fdrd.monthlyDeposit")}</label>
          <input
            className="ct-input mt-1"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      )}
      <div className="ct-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="ct-metric-label block">{t("tier.fdrd.rate")}</label>
          <input
            className="ct-input mt-1"
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="ct-metric-label block">{t("tier.fdrd.tenure")}</label>
          <input
            className="ct-input mt-1"
            value={tenure}
            onChange={(e) => setTenure(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      </div>
      <div className="ct-inset ct-stack-sm">
        <Body className="font-semibold">{t("tier.fdrd.maturity", { amount: formatInr(projection.maturityAmount) })}</Body>
        <Caption className="block">
          {t("tier.fdrd.invested", { amount: formatInr(projection.totalInvested) })} ·{" "}
          {t("tier.fdrd.interest", { amount: formatInr(projection.interestEarned) })}
        </Caption>
        {projection.narrativeLines.map((line) => (
          <Caption key={line} className="block">
            {line}
          </Caption>
        ))}
      </div>
    </div>
  );
}

/**
 * Voluntary savings tools that lived under the wrong parents:
 * SIP was under Safety (emergency); FD/RD was under Retirement (pension pillars).
 */
export default function InvestSavingsPanel() {
  const { t } = useTranslation();
  const tabs = useMemo(
    () => [
      { id: "sip", label: t("tools.invest.tabSip") },
      { id: "fdrd", label: t("tools.invest.tabFdrd") },
    ],
    [t],
  );
  const [tab, setTab] = useState("sip");

  return (
    <div className="ct-stack">
      <Caption>{t("tools.invest.intro")}</Caption>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "sip" && (
        <ProGate featureId="sip_advisor">
          <SipAdvisorTab />
        </ProGate>
      )}
      {tab === "fdrd" && <FdRdTab />}
    </div>
  );
}
