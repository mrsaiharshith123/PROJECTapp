import { useMemo } from "react";
import InfoTip from "./InfoTip.jsx";
import { CALC_HELP } from "../constants/calculationHelp.js";
import {
  buildChitInstallmentSchedule,
  chitEqualInstallment,
  chitPayout,
  deriveChitCurrentMonth,
} from "../engines/chitFund.js";
import { formatInr } from "../constants/symbols.js";

/** Chit-specific fields on Add / Edit bill (no interest rate). */
export default function ChitFundFields({ values, errors, inputClass, onChange, todayStr }) {
  const V = Number(values.chitValue) || 0;
  const N = Math.floor(Number(values.chitMonths) || 0);
  const m = Math.floor(Number(values.chitCurrentMonth) || 1);
  const mode = values.chitInstallmentMode || "equal";
  const isCustom = mode === "custom";

  const schedule = useMemo(() => {
    if (V <= 0 || N <= 0) return [];
    const custom = values.chitCustomInstallment || values.amount;
    return buildChitInstallmentSchedule(V, N, mode, custom);
  }, [V, N, mode, values.chitCustomInstallment, values.amount]);

  const thisMonth = schedule[m - 1]?.installment;
  const equalHint = V > 0 && N > 0 ? chitEqualInstallment(V, N) : 0;

  const set = (name, value) => onChange(name, value);

  const bumpMonthFromStart = () => {
    if (!values.startDate || N <= 0) return;
    const derived = deriveChitCurrentMonth(values.startDate, N, todayStr);
    const paid = Math.max(0, derived - 1);
    set("chitMonthsPaid", String(paid));
    set("chitCurrentMonth", String(derived));
  };

  const payoutPreview =
    values.chitTaken && V > 0 && Number(values.chitTakenPayout) > 0
      ? Number(values.chitTakenPayout)
      : null;
  const discountPreview = Number(values.chitTakenDiscount) || 0;
  const foremanPct = Number(values.chitForemanPct) || 5;

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
            placeholder="e.g. 50"
            className={inputClass("chitMonths")}
          />
          {errors.chitMonths && <p className="text-xs text-red-500 mt-1">{errors.chitMonths}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Months already paid
            <InfoTip text={CALC_HELP.chitMonthsPaid} />
          </label>
          <input
            type="number"
            min="0"
            name="chitMonthsPaid"
            value={values.chitMonthsPaid}
            onChange={(e) => set("chitMonthsPaid", e.target.value)}
            placeholder="e.g. 46"
            className={inputClass("chitMonthsPaid")}
          />
          {N > 0 && values.chitMonthsPaid !== "" && (
            <p className="text-[10px] text-yellow-800 dark:text-yellow-200 mt-1">
              Now on month <strong>{values.chitCurrentMonth}</strong> of {N}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Current month (#)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={N || 120}
              name="chitCurrentMonth"
              value={values.chitCurrentMonth}
              onChange={(e) => {
                const month = e.target.value;
                set("chitCurrentMonth", month);
                const mi = Math.max(0, Math.floor(Number(month) || 1) - 1);
                set("chitMonthsPaid", String(mi));
              }}
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
          {errors.chitCurrentMonth && (
            <p className="text-xs text-red-500 mt-1">{errors.chitCurrentMonth}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Installment type
          </label>
          <select
            name="chitInstallmentMode"
            value={mode}
            onChange={(e) => set("chitInstallmentMode", e.target.value)}
            className={inputClass("chitInstallmentMode")}
          >
            <option value="equal">Equal every month (value ÷ months)</option>
            <option value="decreasing">Decreasing (high early, low later)</option>
            <option value="custom">My group uses a fixed amount</option>
          </select>
          {mode === "equal" && equalHint > 0 && (
            <p className="text-[10px] text-yellow-800 dark:text-yellow-200 mt-1">
              Typical equal share: about {formatInr(equalHint)}/month (₹5L ÷ 50 ≈ ₹10,000).
            </p>
          )}
        </div>
        {isCustom && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
              Your monthly installment (₹)
            </label>
            <input
              type="number"
              min="0"
              name="chitCustomInstallment"
              value={values.chitCustomInstallment}
              onChange={(e) => set("chitCustomInstallment", e.target.value)}
              placeholder="e.g. 9920"
              className={inputClass("chitCustomInstallment")}
            />
          </div>
        )}
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
          Month {m} installment: <strong>{formatInr(thisMonth)}</strong>
          {mode === "equal" && m < N && <> (same each month)</>}
          {mode === "decreasing" && m < N && (
            <> → month {m + 1} about {formatInr(schedule[m]?.installment || 0)}</>
          )}
        </p>
      )}

      {schedule.length > 0 && schedule.length <= 60 && mode === "decreasing" && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-yellow-800 dark:text-yellow-200">
            View full decreasing schedule
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-white/60 dark:bg-slate-900/40 p-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
              Taken in month #
            </label>
            <input
              type="number"
              min="1"
              max={N || 120}
              value={values.chitTakenAtMonth}
              onChange={(e) => set("chitTakenAtMonth", e.target.value)}
              className={inputClass("chitTakenAtMonth")}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1 inline-flex items-center">
              Cash received (₹)
              <InfoTip text={CALC_HELP.chitPayoutReceived} />
            </label>
            <input
              type="number"
              min="0"
              value={values.chitTakenPayout}
              onChange={(e) => set("chitTakenPayout", e.target.value)}
              placeholder="e.g. 443000"
              className={inputClass("chitTakenPayout")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1 inline-flex items-center">
              Auction discount (₹) — auto from cash received
              <InfoTip text={CALC_HELP.chitDiscount} />
            </label>
            <input
              type="number"
              min="0"
              value={values.chitTakenDiscount}
              onChange={(e) => set("chitTakenDiscount", e.target.value)}
              className={inputClass("chitTakenDiscount")}
            />
            {payoutPreview != null && discountPreview > 0 && (
              <p className="text-[10px] text-gray-600 dark:text-slate-400 mt-1">
                You received {formatInr(payoutPreview)} — discount about {formatInr(discountPreview)} (
                foreman {foremanPct}% included). Full pot was {formatInr(V)}.
              </p>
            )}
            {payoutPreview != null && V > 0 && (
              <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                Check: {formatInr(chitPayout(V, discountPreview, foremanPct))} matches received (rounded).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
