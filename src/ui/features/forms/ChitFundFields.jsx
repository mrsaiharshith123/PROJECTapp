import { useMemo } from "react";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import { Caption } from "../../primitives/Text.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import {
  buildChitInstallmentSchedule,
  chitEqualInstallment,
  chitPayout,
  deriveChitCurrentMonth,
} from "../../../engines/chitFund.js";
import { formatInr } from "../../../constants/symbols.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Chit-specific fields on Add / Edit bill (no interest rate). */
export default function ChitFundFields({ values, errors, fieldClass, onChange, todayStr }) {
  const { t } = useTranslation();
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
    <div className="ct-form-panel ct-form-panel-warning">
      <p className="ct-body font-semibold inline-flex items-center">
        {t("chit.fields.title")}
        <InfoTip text={CALC_HELP.chitInstallments} />
      </p>

      <div className="ct-form-grid">
        <div>
          <label className="ct-field-label">
            {t("chit.fields.totalValue")}
          </label>
          <input
            type="number"
            min="0"
            name="chitValue"
            value={values.chitValue}
            onChange={(e) => set("chitValue", e.target.value)}
            placeholder={t("chit.fields.phValue")}
            className={fieldClass("chitValue")}
          />
          {errors.chitValue && <p className="ct-field-hint ct-text-danger">{errors.chitValue}</p>}
        </div>
        <div>
          <label className="ct-field-label">
            {t("chit.fields.months")}
          </label>
          <input
            type="number"
            min="1"
            max="120"
            name="chitMonths"
            value={values.chitMonths}
            onChange={(e) => set("chitMonths", e.target.value)}
            placeholder={t("chit.fields.phMonths")}
            className={fieldClass("chitMonths")}
          />
          {errors.chitMonths && <p className="ct-field-hint ct-text-danger">{errors.chitMonths}</p>}
        </div>
        <div>
          <label className="ct-field-label">
            {t("chit.fields.monthsPaid")}
            <InfoTip text={CALC_HELP.chitMonthsPaid} />
          </label>
          <input
            type="number"
            min="0"
            name="chitMonthsPaid"
            value={values.chitMonthsPaid}
            onChange={(e) => set("chitMonthsPaid", e.target.value)}
            placeholder={t("chit.fields.phPaid")}
            className={fieldClass("chitMonthsPaid")}
          />
          {N > 0 && values.chitMonthsPaid !== "" && (
            <p className="text-[10px] ct-text-warning mt-1">
              Now on month <strong>{values.chitCurrentMonth}</strong> of {N}
            </p>
          )}
        </div>
        <div>
          <label className="ct-field-label">
            {t("chit.fields.currentMonth")}
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
              className={`${fieldClass("chitCurrentMonth")} flex-1`}
            />
            <button
              type="button"
              onClick={bumpMonthFromStart}
              className="shrink-0 px-2 py-2 text-[10px] font-semibold rounded-lg border border-yellow-300 ct-text-warning"
            >
              {t("chit.fields.fromStartDate")}
            </button>
          </div>
          {errors.chitCurrentMonth && (
            <p className="ct-field-hint ct-text-danger">{errors.chitCurrentMonth}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="ct-field-label">
            {t("chit.fields.installmentType")}
          </label>
          <select
            name="chitInstallmentMode"
            value={mode}
            onChange={(e) => set("chitInstallmentMode", e.target.value)}
            className={fieldClass("chitInstallmentMode")}
          >
            <option value="equal">{t("chit.fields.installEqual")}</option>
            <option value="decreasing">{t("chit.fields.installDecreasing")}</option>
            <option value="custom">{t("chit.fields.installCustom")}</option>
          </select>
          {mode === "equal" && equalHint > 0 && (
            <p className="text-[10px] ct-text-warning mt-1">
              Typical equal share: about {formatInr(equalHint)}/month (₹5L ÷ 50 ≈ ₹10,000).
            </p>
          )}
        </div>
        {isCustom && (
          <div className="sm:col-span-2">
            <label className="ct-field-label">
              Your monthly installment (₹)
            </label>
            <input
              type="number"
              min="0"
              name="chitCustomInstallment"
              value={values.chitCustomInstallment}
              onChange={(e) => set("chitCustomInstallment", e.target.value)}
              placeholder={t("chit.fields.phCustomInstallment")}
              className={fieldClass("chitCustomInstallment")}
            />
          </div>
        )}
        <div>
          <label className="ct-field-label">
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
            className={fieldClass("chitForemanPct")}
          />
        </div>
      </div>

      {thisMonth > 0 && (
        <p className="text-xs text-yellow-900 dark:text-yellow-100 bg-white/70 dark:bg-slate-900/50 rounded-lg px-3 py-2">
          Month {m} installment: <strong>{formatInr(thisMonth)}</strong>
          {mode === "equal" && m < N && <> {t("chit.fields.sameEachMonth")}</>}
          {mode === "decreasing" && m < N && (
            <> → month {m + 1} about {formatInr(schedule[m]?.installment || 0)}</>
          )}
        </p>
      )}

      {schedule.length > 0 && schedule.length <= 60 && mode === "decreasing" && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold ct-text-warning">
            View full decreasing schedule
          </summary>
          <ul className="mt-2 max-h-40 overflow-y-auto ct-stack-sm">
            {schedule.map((row) => (
              <li key={row.month} className={row.month === m ? "font-bold ct-text-accent" : ""}>
                Month {row.month}: {formatInr(row.installment)}
              </li>
            ))}
          </ul>
        </details>
      )}

      <label className="flex items-center gap-2 text-sm ">
        <input
          type="checkbox"
          checked={Boolean(values.chitTaken)}
          onChange={(e) => set("chitTaken", e.target.checked)}
          className=""
        />
        I already took the chit (prize money received)
      </label>

      {values.chitTaken && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ct-inset p-3">
          <div>
            <label className="ct-field-label block mb-1">
              Taken in month #
            </label>
            <input
              type="number"
              min="1"
              max={N || 120}
              value={values.chitTakenAtMonth}
              onChange={(e) => set("chitTakenAtMonth", e.target.value)}
              className={fieldClass("chitTakenAtMonth")}
            />
          </div>
          <div>
            <label className="ct-field-label block mb-1 inline-flex items-center">
              Cash received (₹)
              <InfoTip text={CALC_HELP.chitPayoutReceived} />
            </label>
            <input
              type="number"
              min="0"
              value={values.chitTakenPayout}
              onChange={(e) => set("chitTakenPayout", e.target.value)}
              placeholder={t("chit.fields.phPayout")}
              className={fieldClass("chitTakenPayout")}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="ct-field-label block mb-1 inline-flex items-center">
              Auction discount (₹) — auto from cash received
              <InfoTip text={CALC_HELP.chitDiscount} />
            </label>
            <input
              type="number"
              min="0"
              value={values.chitTakenDiscount}
              onChange={(e) => set("chitTakenDiscount", e.target.value)}
              className={fieldClass("chitTakenDiscount")}
            />
            {payoutPreview != null && discountPreview > 0 && (
              <Caption className="block mt-1 opacity-75">
                You received {formatInr(payoutPreview)} — discount about {formatInr(discountPreview)} (
                foreman {foremanPct}% included). Full pot was {formatInr(V)}.
              </Caption>
            )}
            {payoutPreview != null && V > 0 && (
              <Caption className="block ct-text-accent mt-0.5">
                Check: {formatInr(chitPayout(V, discountPreview, foremanPct))} matches received (rounded).
              </Caption>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
