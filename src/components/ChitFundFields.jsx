import { useMemo } from "react";
import InfoTip from "./InfoTip.jsx";
import { CALC_HELP } from "../constants/calculationHelp.js";
import { buildChitInstallmentSchedule, deriveChitCurrentMonth } from "../engines/chitFund.js";
import { formatInr } from "../constants/symbols.js";

/** Chit-specific fields on Add / Edit bill (no interest rate). */
export default function ChitFundFields({ values, errors, inputClass, onChange, todayStr }) {
  const V = Number(values.chitValue) || 0;
  const N = Math.floor(Number(values.chitMonths) || 0);
  const m = Math.floor(Number(values.chitCurrentMonth) || 1);

  const schedule = useMemo(() => {
    if (V <= 0 || N <= 0) return [];
    return buildChitInstallmentSchedule(V, N);
  }, [V, N]);

  const thisMonth = schedule[m - 1]?.installment;

  const set = (name, value) => onChange(name, value);

  const bumpMonthFromStart = () => {
    if (!values.startDate || N <= 0) return;
    const derived = deriveChitCurrentMonth(values.startDate, N, todayStr);
    set("chitCurrentMonth", String(derived));
  };

  return (
    <div className="space-y-4 rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-950/20 p-4">
      <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 inline-flex items-center">
        Chit fund details
        <InfoTip text={CALC_HELP.chitInstallments} />
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Total chit value (₹)
          </label>
          <input
            type="number"
            min="0"
            name="chitValue"
            value={values.chitValue}
            onChange={(e) => set("chitValue", e.target.value)}
            placeholder="e.g. 500000"
            className={inputClass("chitValue")}
          />
          {errors.chitValue && <p className="text-xs text-red-500 mt-1">{errors.chitValue}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Number of months
          </label>
          <input
            type="number"
            min="1"
            max="120"
            name="chitMonths"
            value={values.chitMonths}
            onChange={(e) => set("chitMonths", e.target.value)}
            placeholder="e.g. 20"
            className={inputClass("chitMonths")}
          />
          {errors.chitMonths && <p className="text-xs text-red-500 mt-1">{errors.chitMonths}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Current month (installment #)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              name="chitCurrentMonth"
              value={values.chitCurrentMonth}
              onChange={(e) => set("chitCurrentMonth", e.target.value)}
              className={`${inputClass("chitCurrentMonth")} flex-1`}
            />
            <button
              type="button"
              onClick={bumpMonthFromStart}
              className="shrink-0 px-2 py-2 text-[10px] font-semibold rounded-lg border border-yellow-300 text-yellow-800 dark:text-yellow-200"
            >
              From start date
            </button>
          </div>
          {errors.chitCurrentMonth && <p className="text-xs text-red-500 mt-1">{errors.chitCurrentMonth}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Foreman fee (%)
            <InfoTip text={CALC_HELP.chitForeman} />
          </label>
          <input
            type="number"
            min="0"
            max="15"
            step="0.5"
            name="chitForemanPct"
            value={values.chitForemanPct}
            onChange={(e) => set("chitForemanPct", e.target.value)}
            className={inputClass("chitForemanPct")}
          />
        </div>
      </div>

      {thisMonth > 0 && (
        <p className="text-xs text-yellow-900 dark:text-yellow-100 bg-white/70 dark:bg-slate-900/50 rounded-lg px-3 py-2">
          This month&apos;s installment (auto): <strong>{formatInr(thisMonth)}</strong>
          {m < N && (
            <>
              {" "}
              → next month about {formatInr(schedule[m]?.installment || 0)}. Amount updates by itself each month.
            </>
          )}
        </p>
      )}

      {schedule.length > 0 && schedule.length <= 24 && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-yellow-800 dark:text-yellow-200">
            View full installment schedule
          </summary>
          <ul className="mt-2 max-h-40 overflow-y-auto space-y-0.5 text-gray-700 dark:text-slate-300">
            {schedule.map((row) => (
              <li key={row.month} className={row.month === m ? "font-bold text-indigo-700" : ""}>
                Month {row.month}: {formatInr(row.installment)}
              </li>
            ))}
          </ul>
        </details>
      )}

      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={Boolean(values.chitTaken)}
          onChange={(e) => set("chitTaken", e.target.checked)}
          className="rounded border-gray-300"
        />
        I already took the chit (prize money received)
      </label>

      {values.chitTaken && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Taken in month #</label>
            <input
              type="number"
              min="1"
              value={values.chitTakenAtMonth}
              onChange={(e) => set("chitTakenAtMonth", e.target.value)}
              className={inputClass("chitTakenAtMonth")}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 inline-flex items-center">
              Auction discount (₹)
              <InfoTip text={CALC_HELP.chitDiscount} />
            </label>
            <input
              type="number"
              min="0"
              value={values.chitTakenDiscount}
              onChange={(e) => set("chitTakenDiscount", e.target.value)}
              placeholder="Amount below full chit value"
              className={inputClass("chitTakenDiscount")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
