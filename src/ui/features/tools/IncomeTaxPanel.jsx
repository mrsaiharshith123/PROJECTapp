import { useMemo, useState } from "react";
import { estimateIncomeTax } from "../../../engines/incomeTaxEstimate.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { formatInr, INR } from "../../../constants/symbols.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { Caption, Body, Heading } from "../../primitives/Text.jsx";
import { Badge } from "../../primitives/Badge.jsx";

export default function IncomeTaxPanel() {
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
        <Badge tone="info">Advanced · estimate only</Badge>
        {profileIncome > 0 && (
          <Caption>Profile salary used as a starting hint — edit if needed.</Caption>
        )}
      </div>

      <SegmentedControl
        options={[
          { id: "yearly", label: "Per year" },
          { id: "monthly", label: "Per month" },
        ]}
        value={inputMode}
        onChange={setInputMode}
      />

      <div>
        <label className="ct-metric-label block">
          {inputMode === "monthly" ? `Salary per month (${INR})` : `Salary per year (${INR})`}
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
        <label className="ct-metric-label block">Tax regime</label>
        <SegmentedControl
          options={[
            { id: "new", label: "New (default)" },
            { id: "old", label: "Old + deductions" },
          ]}
          value={regime}
          onChange={(id) => setRegime(id === "old" ? "old" : "new")}
        />
        <Caption className="mt-1 block">
          {regime === "new"
            ? "Usually simpler — standard deduction applied automatically."
            : "Use if you claim 80C / 80D and stay on the old regime."}
        </Caption>
      </div>

      <button type="button" className="ct-link !text-xs self-start" onClick={() => setShowMore((v) => !v)}>
        {showMore ? "Hide extra fields" : "More options (80C / 80D)"}
      </button>

      {showMore && regime === "old" && (
        <div className="ct-grid-2">
          <div>
            <label className="ct-metric-label block">80C ({INR})</label>
            <input
              className="ct-input mt-1"
              value={deduction80c}
              onChange={(e) => setDeduction80c(e.target.value)}
              placeholder="150000 max"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="ct-metric-label block">80D ({INR})</label>
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
            About {formatInr(result.totalTax)} tax / year
          </Heading>
          <Body className="!text-sm">
            Take-home ≈ {formatInr(result.takeHomeMonthly)} / month after tax (rough)
          </Body>
          <Caption>
            Effective rate ~{result.effectiveRatePercent}% · TDS hint ~{formatInr(result.monthlyTds)} / month
          </Caption>
          <Caption className="block opacity-90">{result.disclaimer}</Caption>
        </div>
      )}
    </div>
  );
}
