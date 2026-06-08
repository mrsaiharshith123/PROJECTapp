import { useMemo, useState } from "react";
import { estimateIncomeTax } from "../../../engines/incomeTaxEstimate.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { formatInr, INR } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body, Heading } from "../../primitives/Text.jsx";
import { Badge } from "../../primitives/Badge.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function IncomeTaxPanel() {
  const { t } = useTranslation();
  const { settings } = useCommitTrack();
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

  const result = useMemo(
    () =>
      estimateIncomeTax({
        annualGrossIncome: annualGross,
        regime,
        deduction80c: Number(deduction80c) || 0,
        deduction80d: Number(deduction80d) || 0,
      }),
    [annualGross, regime, deduction80c, deduction80d],
  );

  return (
    <div className="ct-stack">
      <div className="ct-row-between flex-wrap gap-2">
        <Badge tone="info">{t("tax.badge")}</Badge>
        {profileIncome > 0 && <Caption>{t("tax.profileSalaryHint")}</Caption>}
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
        <label className="ct-metric-label block">
          {inputMode === "monthly" ? t("tax.salaryPerMonth", { currency: INR }) : t("tax.salaryPerYear", { currency: INR })}
        </label>
        <input
          className="ct-input mt-1"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={inputMode === "monthly" ? "50000" : "600000"}
          inputMode="numeric"
        />
      </div>

      <div>
        <label className="ct-metric-label block">{t("tax.regimeLabel")}</label>
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
            <label className="ct-metric-label block">{t("tax.deduction80c", { currency: INR })}</label>
            <input
              className="ct-input mt-1"
              value={deduction80c}
              onChange={(e) => setDeduction80c(e.target.value)}
              placeholder={t("tax.ph80cMax")}
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="ct-metric-label block">{t("tax.deduction80d", { currency: INR })}</label>
            <input
              className="ct-input mt-1"
              value={deduction80d}
              onChange={(e) => setDeduction80d(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>
      )}

      {annualGross > 0 && (
        <div className="ct-insight-accent ct-stack-sm">
          <Heading level={3} className="!text-base">
            {t("tax.aboutTaxYear", { amount: formatInr(result.totalTax) })}
          </Heading>
          <Body className="!text-sm">
            {t("tax.takeHomeMonthly", { amount: formatInr(result.takeHomeMonthly) })}
          </Body>
          <Caption>
            {t("tax.effectiveRate", {
              rate: result.effectiveRatePercent,
              tds: formatInr(result.monthlyTds),
            })}
          </Caption>
          <Caption className="block opacity-90">{t("tax.disclaimer")}</Caption>
        </div>
      )}
    </div>
  );
}
