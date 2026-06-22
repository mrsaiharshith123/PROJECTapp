import { useMemo, useState } from "react";
import {
  estimateIncomeTax,
  deriveTaxDeductionsFromCommitments,
  computeHraExemption,
} from "../../../engines/incomeTaxEstimate.js";
import { computeAdvanceTaxSchedule, advanceTaxCommitmentDrafts } from "../../../engines/advanceTax.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { formatInr, INR } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption } from "../../primitives/Text.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { ProGate } from "../../patterns/ProGate.jsx";
import { Button } from "../../primitives/Button.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { exportAnnualReportToExcel } from "../../../utils/excelExport.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";

const fieldClass = `${inputClassName()} ct-input-tint`;

function HraCalculatorTab() {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const profileIncome = combinedMonthlyIncome(settings);
  const defaultAnnual = profileIncome > 0 ? Math.round(profileIncome * 12) : "";

  const [salary, setSalary] = useState(defaultAnnual ? String(defaultAnnual) : "");
  const [hraReceived, setHraReceived] = useState("");
  const [rentPaid, setRentPaid] = useState("");
  const [isMetro, setIsMetro] = useState(true);

  const result = useMemo(() => {
    const annualSalary = Math.max(0, Number(salary) || 0);
    const exemption = computeHraExemption({
      annualSalary,
      annualHraReceived: Number(hraReceived) || 0,
      annualRentPaid: Number(rentPaid) || 0,
      isMetro,
    });
    const rent = Math.max(0, Number(rentPaid) || 0);
    const tenPct = annualSalary * 0.1;
    const rentMinusTen = Math.max(0, rent - tenPct);
    const salaryCap = annualSalary * (isMetro ? 0.5 : 0.4);
    return { exemption, rentMinusTen, salaryCap, annualSalary };
  }, [salary, hraReceived, rentPaid, isMetro]);

  return (
    <div className="ct-stack">
      <Caption>{t("tools.hra.intro")}</Caption>
      {result.annualSalary > 0 && Number(rentPaid) > 0 && (
        <ToolAnswerHero
          tone="wealth"
          label={t("tools.incomeTax.tabHra")}
          value={formatInr(result.exemption)}
          subtitle={t("tools.hra.minimumRule")}
        />
      )}
      <div>
        <label className="ct-field-label">{t("tools.hra.annualSalary", { currency: INR })}</label>
        <input className={fieldClass} value={salary} onChange={(e) => setSalary(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-field-label">{t("tools.hra.hraReceived", { currency: INR })}</label>
        <input className={fieldClass} value={hraReceived} onChange={(e) => setHraReceived(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <div>
        <label className="ct-field-label">{t("tools.hra.rentPaid", { currency: INR })}</label>
        <input className={fieldClass} value={rentPaid} onChange={(e) => setRentPaid(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" />
      </div>
      <label className="ct-row gap-2 items-center">
        <input type="checkbox" checked={isMetro} onChange={(e) => setIsMetro(e.target.checked)} />
        <Caption>{t("tools.hra.metro")}</Caption>
      </label>
      {result.annualSalary > 0 && Number(rentPaid) > 0 && (
        <div className="ct-grid-2">
          <div className="ct-stat-tile teal">
            <p className="ct-stat-tile-value text-sm">{t("tools.hra.rentMinusTen", { amount: formatInr(Math.round(result.rentMinusTen)) })}</p>
          </div>
          <div className="ct-stat-tile indigo">
            <p className="ct-stat-tile-value text-sm">{t("tools.hra.salaryCap", { amount: formatInr(Math.round(result.salaryCap)) })}</p>
          </div>
        </div>
      )}
      <div className="ct-stat-tile">
        <p className="ct-stat-tile-label">{t("tools.hra.disclaimer")}</p>
      </div>
    </div>
  );
}

export default function IncomeTaxPanel() {
  const { t } = useTranslation();
  const [panelTab, setPanelTab] = useState("tax");
  const { settings, commitments, getEffectiveStatus, addCommitment, todayStr, lendings } = usePerovo();
  const intel = useCommitIntel();
  const profileIncome = combinedMonthlyIncome(settings);
  const defaultAnnual = profileIncome > 0 ? Math.round(profileIncome * 12) : "";

  const [inputMode, setInputMode] = useState("yearly");
  const [amount, setAmount] = useState(defaultAnnual ? String(defaultAnnual) : "");
  const [regime, setRegime] = useState(/** @type {"new"|"old"} */ ("new"));
  const [showMore, setShowMore] = useState(false);
  const [deduction80c, setDeduction80c] = useState("");
  const [deduction80d, setDeduction80d] = useState("");

  const annualGross = useMemo(() => {
    const n = Math.max(0, Number(amount) || 0);
    return inputMode === "monthly" ? n * 12 : n;
  }, [amount, inputMode]);

  const autoDeductions = useMemo(
    () => deriveTaxDeductionsFromCommitments(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  const result = useMemo(
    () =>
      estimateIncomeTax({
        annualGrossIncome: annualGross,
        regime,
        deduction80c: Number(deduction80c) || autoDeductions.deduction80c,
        deduction80d: Number(deduction80d) || autoDeductions.deduction80d,
        annualRentPaid: autoDeductions.annualRentPaid,
        isMetro: true,
      }),
    [annualGross, regime, deduction80c, deduction80d, autoDeductions],
  );

  const taxInput = useMemo(
    () => ({
      annualGrossIncome: annualGross,
      regime,
      deduction80c: Number(deduction80c) || autoDeductions.deduction80c,
      deduction80d: Number(deduction80d) || autoDeductions.deduction80d,
      annualRentPaid: autoDeductions.annualRentPaid,
    }),
    [annualGross, regime, deduction80c, deduction80d, autoDeductions],
  );

  const advanceTax = useMemo(() => computeAdvanceTaxSchedule(taxInput, todayStr), [taxInput, todayStr]);
  const advanceTaxDrafts = useMemo(() => advanceTaxCommitmentDrafts(taxInput, todayStr), [taxInput, todayStr]);

  return (
    <div className="ct-stack">
      <SegmentedControl
        options={[
          { id: "tax", label: t("tools.incomeTax.tabTax") },
          { id: "hra", label: t("tools.incomeTax.tabHra") },
        ]}
        value={panelTab}
        onChange={setPanelTab}
      />

      {panelTab === "hra" && (
        <ProGate featureId="full_income_tax">
          <HraCalculatorTab />
        </ProGate>
      )}

      {panelTab === "tax" && (
        <>
      {annualGross > 0 && (
        <ToolAnswerHero
          tone="sim"
          label={t("tax.estimatedTax")}
          value={formatInr(result.totalTax)}
          subtitle={t("tax.takeHomeMonthly", { amount: formatInr(result.takeHomeMonthly) })}
        >
          <Caption>
            {t("tax.effectiveRate", {
              rate: result.effectiveRatePercent,
              tds: formatInr(result.monthlyTds),
            })}
          </Caption>
          <Caption className="block opacity-90">{t("tax.disclaimer")}</Caption>
          {result.optimizationInsights?.map((line) => (
            <Caption key={line} className="block ct-text-accent">
              {line}
            </Caption>
          ))}
        </ToolAnswerHero>
      )}

      <div className="ct-row-between flex-wrap gap-2">
        <Badge tone="info">{t("tax.badge")}</Badge>
        <div className="ct-row gap-2 items-center flex-wrap">
          {profileIncome > 0 && <Caption>{t("tax.profileSalaryHint")}</Caption>}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              exportAnnualReportToExcel({
                commitments,
                lendings,
                snapshots: [
                  {
                    month: todayStr.slice(0, 7),
                    pressureScore: intel.stability?.score,
                    monthlyBurden: intel.stability?.monthlyBurden,
                    freeMoney: intel.stability?.freeMoney,
                    overdueCount: commitments.filter((c) => getEffectiveStatus(c) === "overdue").length,
                  },
                ],
              })
            }
          >
            {t("export.excel.annual")}
          </Button>
        </div>
      </div>

      <SegmentedControl
        options={[
          { id: "yearly", label: t("tax.perYear") },
          { id: "monthly", label: t("tax.perMonth") },
        ]}
        value={inputMode}
        onChange={setInputMode}
      />

      <div>
        <label className="ct-field-label">
          {inputMode === "monthly" ? t("tax.salaryPerMonth", { currency: INR }) : t("tax.salaryPerYear", { currency: INR })}
        </label>
        <input
          className={fieldClass}
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={inputMode === "monthly" ? "50000" : "600000"}
          inputMode="numeric"
        />
      </div>

      <div>
        <label className="ct-field-label">{t("tax.regimeLabel")}</label>
        <SegmentedControl
          options={[
            { id: "new", label: t("tax.regime.new") },
            { id: "old", label: t("tax.regime.old") },
          ]}
          value={regime}
          onChange={(id) => setRegime(id === "old" ? "old" : "new")}
        />
        <Caption className="mt-1 block">
          {regime === "new" ? t("tax.regimeNewHint") : t("tax.regimeOldHint")}
        </Caption>
      </div>

      <button type="button" className="ct-link !text-xs self-start" onClick={() => setShowMore((v) => !v)}>
        {showMore ? t("tax.hideExtra") : t("tax.moreOptions")}
      </button>

      {showMore && regime === "old" && (
        <div className="ct-grid-2">
          <div>
            <label className="ct-field-label">{t("tax.deduction80c", { currency: INR })}</label>
            <input
              className={fieldClass}
              value={deduction80c}
              onChange={(e) => setDeduction80c(e.target.value)}
              placeholder={t("tax.ph80cMax")}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="ct-field-label">{t("tax.deduction80d", { currency: INR })}</label>
            <input
              className={fieldClass}
              value={deduction80d}
              onChange={(e) => setDeduction80d(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>
      )}

      {annualGross > 0 && (
        <div className="ct-stack-sm">
          <div className="ct-stat-tile amber">
            <p className="ct-stat-tile-label">{t("tax.advanceTitle")}</p>
            <p className="ct-stat-tile-value text-sm">{advanceTax.message}</p>
          </div>
          {advanceTax.required &&
            advanceTax.quarters.map((q) => (
              <div key={q.quarter} className="ct-stat-tile indigo">
                <p className="ct-stat-tile-value text-sm">
                  Q{q.quarter} — {q.dueLabel}: ₹{q.installmentAmount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          {advanceTax.required && advanceTaxDrafts.length > 0 && (
            <button
              type="button"
              className="ct-btn ct-btn-primary w-full"
              onClick={() => advanceTaxDrafts.forEach((d) => addCommitment(d))}
            >
              {t("tax.advanceAddBills")}
            </button>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
}
