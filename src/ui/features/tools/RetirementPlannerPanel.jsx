import { useEffect, useMemo, useState } from "react";
import { computeEpfProjection, estimateBasicFromGross } from "../../../engines/epfTracker.js";
import { computePpfProjection } from "../../../engines/ppfTracker.js";
import { computeNpsProjection, computeRetirementMix } from "../../../engines/npsPlanner.js";
import { computeGratuityEstimate } from "../../../engines/gratuityEstimate.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const fieldClass = `${inputClassName()} `;

/** @param {{ onProjectedChange?: (n: number) => void }} props */
function EpfTrackerTab({ onProjectedChange }) {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
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
    <div className="ed-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.retirement.tabEpf")}
        value={formatInr(projection.projectedCorpusAtRetirement)}
        subtitle={t("tools.epf.monthlyContribution")}
      />
      <Caption>{t("tools.epf.intro")}</Caption>
      <div>
        <label className="ed-field-label">{t("tools.epf.basicSalary")}</label>
        <input className={fieldClass} value={basic} onChange={(e) => setBasic(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.epf.corpus")}</label>
        <input className={fieldClass} value={corpus} onChange={(e) => setCorpus(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.epf.age")}</label>
        <input className={fieldClass} value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <button type="button" className="ed-btn ed-btn-primary w-full" onClick={save}>
        {t("tools.epf.saveProfile")}
      </button>
      <div className="ed-grid-2">
        <div className="ed-inset-green">
          <p className="ed-stat-value text-sm">
            {t("tools.epf.employeeEmployer", {
              employee: formatInr(projection.monthlyEmployee),
              employer: formatInr(projection.monthlyEmployer),
            })}
          </p>
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
    <div className="ed-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.retirement.tabPpf")}
        value={formatInr(projection.projectedCorpus)}
      />
      <div>
        <label className="ed-field-label">{t("tools.ppf.annualDeposit")}</label>
        <input className={fieldClass} value={annual} onChange={(e) => setAnnual(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.ppf.corpus")}</label>
        <input className={fieldClass} value={corpus} onChange={(e) => setCorpus(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.ppf.years")}</label>
        <input className={fieldClass} value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ed-stack-sm">
        {projection.narrativeLines.map((line) => (
          <div key={line} className="ed-inset">
            <p className="ed-stat-value text-sm">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @param {{ onProjectedChange?: (n: number) => void }} props */
function NpsTrackerTab({ onProjectedChange }) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
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
    <div className="ed-stack">
      <ToolAnswerHero
        tone="wealth"
        label={t("tools.retirement.tabNps")}
        value={formatInr(projection.projectedCorpusAtRetirement)}
      />
      <div>
        <label className="ed-field-label">{t("tools.nps.employeeMonthly")}</label>
        <input className={fieldClass} value={employee} onChange={(e) => setEmployee(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.nps.employerMonthly")}</label>
        <input className={fieldClass} value={employer} onChange={(e) => setEmployer(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.nps.corpus")}</label>
        <input className={fieldClass} value={corpus} onChange={(e) => setCorpus(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.nps.age")}</label>
        <input className={fieldClass} value={age} onChange={(e) => setAge(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ed-stack-sm">
        {projection.narrativeLines.map((line) => (
          <div key={line} className="ed-inset">
            <p className="ed-stat-value text-sm">{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GratuityTab() {
  const { t } = useTranslation();
  const { settings } = usePerovo();
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
    <div className="ed-stack">
      <ToolAnswerHero
        tone="sim"
        label={t("tools.retirement.tabGratuity")}
        value={result.eligible ? formatInr(result.estimatedGratuity) : "—"}
        subtitle={result.eligible ? undefined : result.narrativeLines[0]}
      />
      <Caption>{t("tools.gratuity.intro")}</Caption>
      <div>
        <label className="ed-field-label">{t("tools.gratuity.lastSalary")}</label>
        <input className={fieldClass} value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ed-field-label">{t("tools.gratuity.years")}</label>
        <input className={fieldClass} value={years} onChange={(e) => setYears(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div className="ed-stack-sm">
        {result.narrativeLines.map((line) => (
          <div key={line} className="ed-inset">
            <p className="ed-stat-value text-sm">{line}</p>
          </div>
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
    ],
    [t],
  );
  const [tab, setTab] = useState("epf");
  const [mixEpf, setMixEpf] = useState(0);
  const [mixPpf, setMixPpf] = useState(0);
  const [mixNps, setMixNps] = useState(0);

  const mix = useMemo(() => computeRetirementMix({ epf: mixEpf, ppf: mixPpf, nps: mixNps }), [mixEpf, mixPpf, mixNps]);

  return (
    <div className="ed-stack">
      {mix.total > 0 && tab !== "gratuity" && (
        <ToolAnswerHero
          tone="sim"
          label={t("tools.retirement.mixTitle")}
          value={formatInr(mix.total)}
          subtitle={mix.message}
        />
      )}
      <Caption>{t("tools.retirement.intro")}</Caption>
      <SegmentedControl options={tabs} value={tab} onChange={setTab} />
      {tab === "epf" && <EpfTrackerTab onProjectedChange={setMixEpf} />}
      {tab === "ppf" && <PpfTrackerTab onProjectedChange={setMixPpf} />}
      {tab === "nps" && <NpsTrackerTab onProjectedChange={setMixNps} />}
      {tab === "gratuity" && <GratuityTab />}
    </div>
  );
}
