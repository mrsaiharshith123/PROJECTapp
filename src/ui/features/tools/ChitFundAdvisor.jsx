import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import ToolSourcePicker from "./ToolSourcePicker.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { adviseChitTakeMonth, buildChitInstallmentSchedule } from "../../../engines/chitFund.js";
import { formatInr } from "../../../constants/symbols.js";
import { chitFieldsFromCommitment } from "../../../constants/chitFund.js";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm";

function ChitAnalysis({ params, commitments, settings, getEffectiveStatus, todayStr, onBack }) {
  const [overrideLossPct, setOverrideLossPct] = useState("");
  const [showOverride, setShowOverride] = useState(false);

  const maxLossPercentOverride = useMemo(() => {
    if (!showOverride || overrideLossPct === "") return null;
    return (Number(overrideLossPct) || 0) / 100;
  }, [showOverride, overrideLossPct]);

  const advice = useMemo(
    () =>
      adviseChitTakeMonth({
        ...params,
        commitments,
        getEffectiveStatus,
        todayStr,
        monthlyIncome: settings.monthlyIncome,
        liquidSavings: settings.liquidSavings,
        maxLossPercent: maxLossPercentOverride,
      }),
    [params, commitments, getEffectiveStatus, todayStr, settings, maxLossPercentOverride]
  );

  const suggestedPct = Math.round((advice.lossSuggestion?.maxLossPercent ?? advice.maxLossPercent ?? 0.18) * 100);
  const schedule = useMemo(() => {
    if (params.chitValue <= 0 || params.totalMonths <= 0) return [];
    return buildChitInstallmentSchedule(params.chitValue, params.totalMonths);
  }, [params.chitValue, params.totalMonths]);

  return (
    <div className="space-y-4 text-sm">
      <button type="button" onClick={onBack} className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
        ← Choose another chit
      </button>

      <p className="text-xs text-gray-500 dark:text-slate-400">
        We suggest max loss from your income, dues, and debt — then which month to take the pot.
        <InfoTip text={CALC_HELP.chitAdvisor} />
      </p>

      {advice.lossSuggestion && params.chitValue > 0 && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 p-3 space-y-2 text-xs">
          <p className="font-semibold text-amber-900 dark:text-amber-100 inline-flex items-center">
            Suggested max loss (for you)
            <InfoTip text={CALC_HELP.chitMaxLoss} />
          </p>
          <p className="text-amber-800 dark:text-amber-200">
            Up to <strong>{formatInr(advice.maxLoss)}</strong> (~{suggestedPct}% of chit value).
          </p>
          {advice.lossSuggestion.freeCash != null && (
            <p className="text-amber-700/90 dark:text-amber-300/90">
              Free after dues: {formatInr(advice.lossSuggestion.freeCash)} · Open debt:{" "}
              {formatInr(advice.lossSuggestion.openDebt)}
            </p>
          )}
          {advice.lossSuggestion.reasons?.length > 0 && (
            <ul className="list-disc list-inside text-amber-800/80 space-y-0.5">
              {advice.lossSuggestion.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setShowOverride((v) => !v)}
            className="text-[11px] font-semibold text-amber-900 underline"
          >
            {showOverride ? "Use suggested cap" : "Adjust cap manually"}
          </button>
          {showOverride && (
            <input
              type="number"
              min="5"
              max="35"
              className={inputClass}
              value={overrideLossPct}
              onChange={(e) => setOverrideLossPct(e.target.value)}
              placeholder={`Suggested ${suggestedPct}%`}
            />
          )}
        </div>
      )}

      {advice.summary && (
        <p className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 p-3 text-xs text-indigo-900 dark:text-indigo-100">
          {advice.summary}
        </p>
      )}

      {advice.best && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 p-3 text-xs space-y-1">
          <p className="font-semibold text-emerald-900">Suggested month: {advice.best.month}</p>
          <p>Payout ~{formatInr(advice.best.payout)} · Loss ~{formatInr(advice.best.loss)}</p>
        </div>
      )}

      {advice.rows.length > 0 && (
        <div className="overflow-x-auto max-h-48 overflow-y-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 bg-white dark:bg-slate-900">
              <tr className="text-left text-gray-500 border-b">
                <th className="py-1 pr-2">Mo</th>
                <th className="py-1 pr-2">Pay</th>
                <th className="py-1 pr-2">Disc%</th>
                <th className="py-1 pr-2">Payout</th>
                <th className="py-1 pr-2">Loss</th>
                <th className="py-1">OK?</th>
              </tr>
            </thead>
            <tbody>
              {advice.rows.map((r) => (
                <tr
                  key={r.month}
                  className={
                    advice.best?.month === r.month ? "bg-indigo-50/80 font-semibold" : "border-b border-gray-100"
                  }
                >
                  <td className="py-1.5 pr-2">{r.month}</td>
                  <td className="py-1.5 pr-2">{formatInr(r.installment)}</td>
                  <td className="py-1.5 pr-2">{r.discountPct}%</td>
                  <td className="py-1.5 pr-2">{formatInr(r.payout)}</td>
                  <td className="py-1.5 pr-2">{formatInr(r.loss)}</td>
                  <td className="py-1.5">{r.lossOk ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {schedule.length > 0 && schedule.length <= 30 && (
        <p className="text-xs text-gray-500">
          Installments: {formatInr(schedule[0].installment)} → {formatInr(schedule[schedule.length - 1].installment)} (auto
          each month on your bill).
        </p>
      )}
    </div>
  );
}

export default function ChitFundAdvisor({ commitments, settings, getEffectiveStatus, todayStr }) {
  const navigate = useNavigate();
  const chitBills = useMemo(
    () => commitments.filter((c) => c.category === "Chit Fund" && Number(c.chitValue) > 0),
    [commitments]
  );

  const pickerItems = useMemo(
    () =>
      chitBills.map((c) => {
        const f = chitFieldsFromCommitment(c);
        return {
          id: String(c.id),
          raw: c,
          title: c.name,
          subtitle: `${formatInr(Number(f.chitValue))} · month ${f.chitCurrentMonth}/${f.chitMonths}`,
          meta: c.chitTaken ? "Prize already taken" : "Active chit",
        };
      }),
    [chitBills]
  );

  const [step, setStep] = useState("pick");
  const [selectedBill, setSelectedBill] = useState(null);
  const [manual, setManual] = useState({
    chitValue: "",
    chitMonths: "",
    currentMonth: "1",
    startDate: "",
    chitTaken: false,
  });

  const params = useMemo(() => {
    if (step === "calc" && selectedBill) {
      const f = chitFieldsFromCommitment(selectedBill);
      return {
        chitValue: Number(f.chitValue) || 0,
        totalMonths: Number(f.chitMonths) || 0,
        currentMonth: Number(f.chitCurrentMonth) || 1,
        startDate: selectedBill.startDate || selectedBill.dueDate || "",
        chitTaken: Boolean(selectedBill.chitTaken),
        foremanPct: Number(f.chitForemanPct) || 5,
        excludeCommitmentId: selectedBill.id,
      };
    }
    if (step === "manual") {
      return {
        chitValue: Number(manual.chitValue) || 0,
        totalMonths: Number(manual.chitMonths) || 0,
        currentMonth: Number(manual.currentMonth) || 1,
        startDate: manual.startDate,
        chitTaken: manual.chitTaken,
        foremanPct: 5,
        excludeCommitmentId: null,
      };
    }
    return null;
  }, [step, selectedBill, manual]);

  if (step === "pick") {
    return (
      <ToolSourcePicker
        accent="yellow"
        title="Which chit fund are you planning?"
        hint="Pick one you added, or check without saving a bill."
        items={pickerItems}
        emptyMessage="No chit bills yet."
        manualLabel="Check without adding a bill"
        addLabel="Add chit fund bill"
        onPick={(item) => {
          setSelectedBill(item.raw);
          setStep("calc");
        }}
        onManual={() => setStep("manual")}
        onAdd={() => navigate("/add")}
      />
    );
  }

  if (step === "manual" && !Number(manual.chitValue)) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => setStep("pick")} className="text-xs font-semibold text-indigo-600">
          ← Back
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold">Chit value (₹)</label>
            <input
              className={inputClass}
              value={manual.chitValue}
              onChange={(e) => setManual((m) => ({ ...m, chitValue: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Months</label>
            <input
              className={inputClass}
              value={manual.chitMonths}
              onChange={(e) => setManual((m) => ({ ...m, chitMonths: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Current month #</label>
            <input
              className={inputClass}
              value={manual.currentMonth}
              onChange={(e) => setManual((m) => ({ ...m, currentMonth: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Start date</label>
            <input
              type="date"
              className={inputClass}
              value={manual.startDate}
              onChange={(e) => setManual((m) => ({ ...m, startDate: e.target.value }))}
            />
          </div>
        </div>
      </div>
    );
  }

  if (params) {
    return (
      <ChitAnalysis
        params={params}
        commitments={commitments}
        settings={settings}
        getEffectiveStatus={getEffectiveStatus}
        todayStr={todayStr}
        onBack={() => setStep("pick")}
      />
    );
  }

  return null;
}
