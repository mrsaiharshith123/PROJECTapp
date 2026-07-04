import { useMemo, useState, useEffect } from "react";
import { analyzeSipPlan, buildSipCorpusSeries } from "../../../engines/sipAdvisor.js";
import { estimateCurrentValue, fetchFundNav } from "../../../services/market/amfiNav.js";
import { ToolComparisonChart } from "../../patterns/ToolComparisonChart.jsx";
import { computeFdRdProjection } from "../../../engines/fdRdTracker.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { formatInr } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { ProGate } from "../../patterns/ProGate.jsx";
import { Caption } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const fieldClass = `${inputClassName()} `;

function SipAdvisorTab() {
  const { t } = useTranslation();
  const intel = useCommitIntel();
  const { commitments, updateCommitment } = usePerovo();
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

  const sipCurrentValue = useMemo(
    () =>
      commitments
        .filter((c) => c.category === "SIP" && c.currentNav)
        .reduce((s, c) => s + estimateCurrentValue(c), 0),
    [commitments],
  );

  useEffect(() => {
    const sipWithCodes = commitments.filter((c) => c.category === "SIP" && c.schemeCode);
    if (sipWithCodes.length === 0) return undefined;
    let cancelled = false;
    const refreshNavs = async () => {
      for (const sip of sipWithCodes) {
        if (cancelled) return;
        const nav = await fetchFundNav(sip.schemeCode);
        if (nav?.nav && nav.nav !== sip.currentNav) {
          updateCommitment(sip.id, {
            currentNav: nav.nav,
            navFetchedAt: nav.date,
            navDate: nav.date,
          });
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    };
    refreshNavs();
    return () => {
      cancelled = true;
    };
    // Refresh NAV once when SIP tool opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ed-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.sip.projectedLabel")}
        value={formatInr(plan.projectedCorpus)}
        subtitle={plan.narrativeLines[0]}
      />
      <Caption>{t("tools.sip.intro")}</Caption>
      {sipFromBills > 0 && (
        <Caption className="block">{t("tools.sip.fromBills", { amount: formatInr(sipFromBills) })}</Caption>
      )}
      <div>
        <label className="ed-field-label">{t("tools.sip.monthly")}</label>
        <input
          className={fieldClass}
          value={sip}
          onChange={(e) => setSip(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={sipFromBills ? String(sipFromBills) : "5000"}
          inputMode="numeric"
        />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.sip.years")}</label>
        <input className={fieldClass} value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.sip.target")}</label>
        <input className={fieldClass} value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.sip.return")}</label>
        <input className={fieldClass} value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.sip.boostLabel")}</label>
        <input
          className={fieldClass}
          value={sipBoost}
          onChange={(e) => setSipBoost(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={monthlySip > 0 ? String(Math.round(monthlySip * 0.2)) : "1000"}
          inputMode="numeric"
        />
      </div>
      {sipCurrentValue > 0 ? (
        <div className="ed-inset-green">
          <p className="ed-stat-label">{t("tools.sip.liveValue", { amount: formatInr(sipCurrentValue) })}</p>
          <p className="ed-stat-value text-sm">{t("tools.sip.liveValueHint")}</p>
        </div>
      ) : null}
      {plan.narrativeLines.slice(1).map((line) => (
        <div key={line} className="ed-inset">
          <p className="ed-stat-value text-sm">{line}</p>
        </div>
      ))}
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

import { lookupIfsc } from "../../../services/market/ifscLookup.js";

function FdRdTab() {
  const { t } = useTranslation();
  const [kind, setKind] = useState("fd");
  const [principal, setPrincipal] = useState("");
  const [monthlyDeposit, setMonthlyDeposit] = useState("");
  const [rate, setRate] = useState("7");
  const [tenure, setTenure] = useState("12");
  const [bankName, setBankName] = useState("");
  const [ifscInput, setIfscInput] = useState("");
  const [ifscInfo, setIfscInfo] = useState(null);

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
    <div className="ed-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tier.fdrd.title")}
        value={formatInr(projection.maturityAmount)}
        subtitle={t("tier.fdrd.invested", { amount: formatInr(projection.totalInvested) })}
      />
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
          <label className="ed-field-label">{t("tier.fdrd.principal")}</label>
          <input
            className={fieldClass}
            value={principal}
            onChange={(e) => setPrincipal(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      ) : (
        <div>
          <label className="ed-field-label">{t("tier.fdrd.monthlyDeposit")}</label>
          <input
            className={fieldClass}
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      )}
      <div className="ed-row gap-3 flex-wrap">
        <div className="flex-1 min-w-[120px]">
          <label className="ed-field-label">{t("tier.fdrd.rate")}</label>
          <input
            className={fieldClass}
            value={rate}
            onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
          />
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="ed-field-label">{t("tier.fdrd.tenure")}</label>
          <input
            className={fieldClass}
            value={tenure}
            onChange={(e) => setTenure(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
          />
        </div>
      </div>
      <div>
        <label className="ed-field-label">{t("tier.fdrd.bankName")}</label>
        <input className={fieldClass} value={bankName} onChange={(e) => setBankName(e.target.value)} />
      </div>
      <div>
        <label className="ed-field-label">{t("tier.fdrd.ifsc")}</label>
        <input
          className={fieldClass}
          placeholder={t("tier.fdrd.ifscPlaceholder")}
          value={ifscInput}
          maxLength={11}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setIfscInput(v);
            if (v.length === 11) {
              lookupIfsc(v).then((info) => {
                setIfscInfo(info);
                if (info?.bank) setBankName(info.bank);
              });
            } else {
              setIfscInfo(null);
            }
          }}
        />
        {ifscInfo ? (
          <Caption className="block mt-1">
            {t("tier.fdrd.ifscFound", { bank: ifscInfo.bank, branch: ifscInfo.branch, city: ifscInfo.city })}
          </Caption>
        ) : null}
      </div>
      <div className="ed-grid-2">
        <div className="ed-inset">
          <p className="ed-stat-value text-sm">{t("tier.fdrd.interest", { amount: formatInr(projection.interestEarned) })}</p>
        </div>
        {projection.narrativeLines.map((line) => (
          <div key={line} className="ed-inset col-span-2">
            <p className="ed-stat-value text-sm">{line}</p>
          </div>
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
    <div className="ed-stack">
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
