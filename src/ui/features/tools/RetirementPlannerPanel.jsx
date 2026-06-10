import { useEffect, useMemo, useState } from "react";
import { computeEpfProjection, estimateBasicFromGross } from "../../../engines/epfTracker.js";
import { computePpfProjection } from "../../../engines/ppfTracker.js";
import { computeNpsProjection, computeRetirementMix } from "../../../engines/npsPlanner.js";
import { computeGratuityEstimate } from "../../../engines/gratuityEstimate.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body, Heading } from "../../primitives/Text.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import FdRdTrackerPanel from "./FdRdTrackerPanel.jsx";

/** @param {{ onProjectedChange?: (n: number) => void }} props */
function EpfTrackerTab({ onProjectedChange }) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useCommitTrack();
  const profileIncome = combinedMonthlyIncome(settings);
  const [basic, setBasic] = useState(
    String(settings.epfBasicSalary || (profileIncome ? estimateBasicFromGross(profileIncome) : "")),
  );
  const [corpus, setCorpus] = useState(String(settings.epfCorpus || ""));
  const [age, setAge] = useState(String(settings.epfAge || "30"));

  const projection = useMemo(
    () =>
      computeEpfProjection({
        monthlyBasicSalary: Number(basic) || 0,
        currentCorpus: Number(corpus) || 0,
        age: Number(age) || 30,
        retirementAge: 60,
      }),
    [basic, corpus, age],
  );

  useEffect(() => {
    onProjectedChange?.(projection.projectedCorpusAtRetirement);
  }, [projection.projectedCorpusAtRetirement, onProjectedChange]);

  const save = () => {
    updateSettings({
      epfBasicSalary: Number(basic) || 0,
      epfCorpus: Number(corpus) || 0,
      epfAge: Number(age) || 30,
    });
  };

  return (
    <div className="ct-stack">
      <Caption>{t("tools.epf.intro")}</Caption>
      <div>
        <label className="ct-metric-label block">{t("tools.epf.basicSalary")}</label>
        <input className="ct-input mt-1" value={basic} onChange={(e) => setBasic(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.epf.corpus")}</label>
        <input className="ct-input mt-1" value={corpus} onChange={(e) => setCorpus(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.epf.age")}</label>
        <input className="ct-input mt-1" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <button type="button" className="ct-btn ct-btn-ghost !text-sm" onClick={save}>
        {t("tools.epf.saveProfile")}
      </button>
      <div className="ct-inset ct-stack-sm">
        <Heading level={3}>{t("tools.epf.monthlyContribution")}</Heading>
        <Body className="!text-sm">
          {t("tools.epf.employeeEmployer", {
            employee: formatInr(projection.monthlyEmployee),
            employer: formatInr(projection.monthlyEmployer),
          })}
        </Body>
        <Caption>
          {t("tools.epf.projectedRetirement", { amount: formatInr(projection.projectedCorpusAtRetirement) })}
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

/** @param {{ onProjectedChange?: (n: number) => void }} props */
function PpfTrackerTab({ onProjectedChange }) {
  const { t } = useTranslation();
  const [annual, setAnnual] = useState("150000");
  const [corpus, setCorpus] = useState("");
  const [years, setYears] = useState("15");

  const projection = useMemo(
    () =>
      computePpfProjection({
        annualContribution: Number(annual) || 0,
        currentCorpus: Number(corpus) || 0,
        yearsRemaining: Number(years) || 15,
      }),
    [annual, corpus, years],
  );

  useEffect(() => {
    onProjectedChange?.(projection.projectedCorpus);
  }, [projection.projectedCorpus, onProjectedChange]);

  return (
    <div className="ct-stack">
      <div>
        <label className="ct-metric-label block">{t("tools.ppf.annualDeposit")}</label>
        <input className="ct-input mt-1" value={annual} onChange={(e) => setAnnual(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.ppf.corpus")}</label>
        <input className="ct-input mt-1" value={corpus} onChange={(e) => setCorpus(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.ppf.years")}</label>
        <input className="ct-input mt-1" value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ct-inset ct-stack-sm">
        <Heading level={3} className="!text-base">
          {t("tools.ppf.projected", { amount: formatInr(projection.projectedCorpus) })}
        </Heading>
        {projection.narrativeLines.map((line) => (
          <Caption key={line} className="block">
            {line}
          </Caption>
        ))}
      </div>
    </div>
  );
}

/** @param {{ onProjectedChange?: (n: number) => void }} props */
function NpsTrackerTab({ onProjectedChange }) {
  const { t } = useTranslation();
  const { settings } = useCommitTrack();
  const income = combinedMonthlyIncome(settings);
  const defaultBasic = income ? estimateBasicFromGross(income) : 0;
  const defaultEmployee = defaultBasic ? Math.round(defaultBasic * 0.1) : "";

  const [employee, setEmployee] = useState(defaultEmployee ? String(defaultEmployee) : "");
  const [employer, setEmployer] = useState(defaultEmployee ? String(defaultEmployee) : "");
  const [corpus, setCorpus] = useState("");
  const [age, setAge] = useState(String(settings.epfAge || 30));

  const projection = useMemo(
    () =>
      computeNpsProjection({
        monthlyEmployee: Number(employee) || 0,
        monthlyEmployer: Number(employer) || 0,
        currentCorpus: Number(corpus) || 0,
        age: Number(age) || 30,
      }),
    [employee, employer, corpus, age],
  );

  useEffect(() => {
    onProjectedChange?.(projection.projectedCorpusAtRetirement);
  }, [projection.projectedCorpusAtRetirement, onProjectedChange]);

  return (
    <div className="ct-stack">
      <div>
        <label className="ct-metric-label block">{t("tools.nps.employeeMonthly")}</label>
        <input className="ct-input mt-1" value={employee} onChange={(e) => setEmployee(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.nps.employerMonthly")}</label>
        <input className="ct-input mt-1" value={employer} onChange={(e) => setEmployer(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.nps.corpus")}</label>
        <input className="ct-input mt-1" value={corpus} onChange={(e) => setCorpus(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.nps.age")}</label>
        <input className="ct-input mt-1" value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ct-inset ct-stack-sm">
        <Heading level={3} className="!text-base">
          {t("tools.nps.projected", { amount: formatInr(projection.projectedCorpusAtRetirement) })}
        </Heading>
        {projection.narrativeLines.map((line) => (
          <Caption key={line} className="block">
            {line}
          </Caption>
        ))}
      </div>
    </div>
  );
}

function GratuityTab() {
  const { t } = useTranslation();
  const { settings } = useCommitTrack();
  const income = combinedMonthlyIncome(settings);

  const [salary, setSalary] = useState(income ? String(income) : "");
  const [years, setYears] = useState("5");

  const result = useMemo(
    () =>
      computeGratuityEstimate({
        lastDrawnMonthlySalary: Number(salary) || 0,
        yearsOfService: Number(years) || 0,
      }),
    [salary, years],
  );

  return (
    <div className="ct-stack">
      <Caption>{t("tools.gratuity.intro")}</Caption>
      <div>
        <label className="ct-metric-label block">{t("tools.gratuity.lastSalary")}</label>
        <input className="ct-input mt-1" value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-metric-label block">{t("tools.gratuity.years")}</label>
        <input className="ct-input mt-1" value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ct-inset ct-stack-sm">
        {result.eligible ? (
          <Heading level={3} className="!text-base">
            {t("tools.gratuity.estimate", { amount: formatInr(result.estimatedGratuity) })}
          </Heading>
        ) : (
          <Caption className="block">{result.narrativeLines[0]}</Caption>
        )}
        {result.narrativeLines.map((line) => (
          <Caption key={line} className="block">
            {line}
          </Caption>
        ))}
      </div>
    </div>
  );
}

export default function RetirementPlannerPanel() {
  const { t } = useTranslation();
  const tabs = useMemo(
    () => [
      { id: "epf", label: t("tools.retirement.tabEpf") },
      { id: "ppf", label: t("tools.retirement.tabPpf") },
      { id: "nps", label: t("tools.retirement.tabNps") },
      { id: "gratuity", label: t("tools.retirement.tabGratuity") },
      { id: "fdrd", label: t("tools.retirement.tabFdrd") },
    ],
    [t],
  );
  const [tab, setTab] = useState("epf");
  const [mixEpf, setMixEpf] = useState(0);
  const [mixPpf, setMixPpf] = useState(0);
  const [mixNps, setMixNps] = useState(0);

  const mix = useMemo(() => computeRetirementMix({ epf: mixEpf, ppf: mixPpf, nps: mixNps }), [mixEpf, mixPpf, mixNps]);

  return (
    <div className="ct-stack">
      <Caption>{t("tools.retirement.intro")}</Caption>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "epf" && <EpfTrackerTab onProjectedChange={setMixEpf} />}
      {tab === "ppf" && <PpfTrackerTab onProjectedChange={setMixPpf} />}
      {tab === "nps" && <NpsTrackerTab onProjectedChange={setMixNps} />}
      {tab === "gratuity" && <GratuityTab />}
      {tab === "fdrd" && <FdRdTrackerPanel />}
      {mix.total > 0 && tab !== "gratuity" && tab !== "fdrd" && (
        <div className="ct-inset ct-stack-sm">
          <Caption className="font-semibold block">{t("tools.retirement.mixTitle")}</Caption>
          <Caption className="block">{mix.message}</Caption>
          {mix.shares.map((s) => (
            <Caption key={s.id} className="block">
              {s.label}: {s.percent}%
            </Caption>
          ))}
        </div>
      )}
    </div>
  );
}
