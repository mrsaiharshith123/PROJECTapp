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
    <div className="ct-stat-tile amber ct-form-panel ct-form-panel-warning">
      <p className="ct-body font-semibold inline-flex items-center">
        {t("chit.fields.title")}
        <InfoTip text={CALC_HELP.chitInstallments} />
      </p>

      <div className="ct-form-grid">
        <div>
          <label className="ct-field-label">{t("chit.fields.totalValue")}</label>
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
          <label className="ct-field-label">{t("chit.fields.months")}</label>
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
            <p className="ct-field-hint ct-text-warning mt-1">
              {t("chit.fields.nowOnMonth", { current: values.chitCurrentMonth, total: N })}
            </p>
          )}
        </div>
        <div>
          <label className="ct-field-label">{t("chit.fields.currentMonth")}</label>
          <div className="ct-row gap-2">
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
              className="ct-btn ct-btn-outline ct-btn-sm shrink-0"
            >
              {t("chit.fields.fromStartDate")}
            </button>
          </div>
          {errors.chitCurrentMonth && (
            <p className="ct-field-hint ct-text-danger">{errors.chitCurrentMonth}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="ct-field-label">{t("chit.fields.installmentType")}</label>
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
            <p className="ct-field-hint ct-text-warning mt-1">
              {t("chit.fields.equalHint", { amount: formatInr(equalHint) })}
            </p>
          )}
        </div>
        {isCustom && (
          <div className="sm:col-span-2">
            <label className="ct-field-label">{t("chit.fields.customInstallment")}</label>
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
            {t("chit.fields.foremanFee")}
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
        <p className="ct-insight-warning rounded-lg px-3 py-2 text-xs">
          {t("chit.fields.monthInstallment", { month: m, amount: formatInr(thisMonth) })}
          {mode === "equal" && m < N && <> {t("chit.fields.sameEachMonth")}</>}
          {mode === "decreasing" && m < N && (
            <>
              {" "}
              {t("chit.fields.nextMonthAbout", {
                next: m + 1,
                amount: formatInr(schedule[m]?.installment || 0),
              })}
            </>
          )}
        </p>
      )}

      {schedule.length > 0 && schedule.length <= 60 && mode === "decreasing" && (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold ct-text-warning">
            {t("chit.fields.viewSchedule")}
          </summary>
          <ul className="mt-2 max-h-40 overflow-y-auto ct-stack-sm">
            {schedule.map((row) => (
              <li key={row.month} className={row.month === m ? "font-bold ct-text-accent" : ""}>
                {t("chit.fields.monthLine", { month: row.month, amount: formatInr(row.installment) })}
              </li>
            ))}
          </ul>
        </details>
      )}

      <label className="ct-row gap-2 items-center text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(values.chitTaken)}
          onChange={(e) => set("chitTaken", e.target.checked)}
        />
        {t("chit.fields.takenCheckbox")}
      </label>

      {values.chitTaken && (
        <div className="ct-form-grid ct-inset p-3">
          <div>
            <label className="ct-field-label">{t("chit.fields.takenMonth")}</label>
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
            <label className="ct-field-label inline-flex items-center">
              {t("chit.fields.cashReceived")}
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
            <label className="ct-field-label inline-flex items-center">
              {t("chit.fields.auctionDiscount")}
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
                {t("chit.fields.payoutSummary", {
                  received: formatInr(payoutPreview),
                  discount: formatInr(discountPreview),
                  pct: foremanPct,
                  pot: formatInr(V),
                })}
              </Caption>
            )}
            {payoutPreview != null && V > 0 && (
              <Caption className="block ct-text-accent mt-0.5">
                {t("chit.fields.payoutCheck", {
                  amount: formatInr(chitPayout(V, discountPreview, foremanPct)),
                })}
              </Caption>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
