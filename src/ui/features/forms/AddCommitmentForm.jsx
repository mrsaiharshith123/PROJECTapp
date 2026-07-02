import { Card, Button, PageShell } from "../../index.js";
import { Caption } from "../../primitives/Text.jsx";
import ChitFundFields from "./ChitFundFields.jsx";
import InsuranceFields from "./InsuranceFields.jsx";
import { OTHER_PRIORITY_OPTIONS } from "../../../constants/priority.js";
import { PROFILE_SETTINGS_HINT } from "../../../constants/plainLanguage.js";
import { affordabilityTierTone } from "../../../engines/affordability.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { REPEAT_OPTIONS } from "../../../constants/repeatTypes.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCopy } from "../../../i18n/useCopy.js";

export default function AddCommitmentForm({
  form,
  errors,
  fieldClass,
  billCategories,
  showChit,
  showInsurance,
  showInterest,
  isSubscription,
  isOther,
  category,
  priorSpendHint,
  todayStr,
  affordability,
  onChange,
  onChitChange,
  onInsuranceChange,
  onFillEndDate,
  onSubmit,
  embedded = false,
}) {
  const { t } = useTranslation();
  const copy = useCopy();

  const formBody = (
    <>
    <Card className="ct-stack-lg">
        <div>
          <label className="ct-field-label">{t("add.categoryLabel")}</label>
          <select name="category" value={form.category} onChange={onChange} className={fieldClass("category")}>
            <option value="">{t("add.selectCategory")}</option>
            {billCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && <p className="ct-field-hint ct-text-danger">{errors.category}</p>}
        </div>

        {showChit && (
          <ChitFundFields
            values={form}
            errors={errors}
            fieldClass={fieldClass}
            todayStr={todayStr}
            onChange={onChitChange}
          />
        )}

        {showInsurance && (
          <InsuranceFields
            values={form}
            errors={errors}
            fieldClass={fieldClass}
            onChange={onInsuranceChange}
          />
        )}

        <div>
          <label className="ct-field-label">
            {showChit ? t("commitment.edit.installment") : t("commitment.edit.amount")}
          </label>
          <div className="ct-input-prefix-wrap">
            <span className="ct-input-prefix">₹</span>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={onChange}
              placeholder="0"
              min="0"
              readOnly={showChit && form.chitInstallmentMode !== "custom"}
              className={`${fieldClass("amount")} ct-input-with-prefix ${showChit && form.chitInstallmentMode !== "custom" ? "opacity-80 cursor-default" : ""}`}
            />
          </div>
          {errors.amount && <p className="ct-field-hint ct-text-danger">{errors.amount}</p>}
          {showChit && form.chitInstallmentMode !== "custom" && (
            <Caption className="block mt-1 ct-text-warning">
              {t("add.form.chitInstallmentHint")}
            </Caption>
          )}
        </div>

        <div className="ct-grid-2">
          <div>
            <label className="ct-field-label">
              {t("commitment.edit.startDate")}{" "}
              <span className="ct-caption font-normal opacity-75">{t("add.form.startDateHint")}</span>
            </label>
            <input type="date" name="startDate" value={form.startDate} onChange={onChange} className={fieldClass("startDate")} />
            {errors.startDate && <p className="ct-field-hint ct-text-danger">{errors.startDate}</p>}
          </div>
          <div>
            <label className="ct-field-label">
              {t("commitment.edit.endDate")}{" "}
              <span className="ct-caption font-normal opacity-75">
                {isSubscription ? t("add.form.endDateCancelHint") : t("add.form.endDateOptional")}
              </span>
            </label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              onFocus={onFillEndDate}
              className={fieldClass("endDate")}
            />
            {errors.endDate && <p className="ct-field-hint ct-text-danger">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label className="ct-field-label">{t("commitment.edit.nextDue")}</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} className={fieldClass("dueDate")} />
          {errors.dueDate && <p className="ct-field-hint ct-text-danger">{errors.dueDate}</p>}
          <Caption className="block mt-1 opacity-75">{t("add.form.dueDateHint")}</Caption>
        </div>

        {priorSpendHint > 0 && (
          <div className="ct-stat-tile teal">
            <p className="ct-stat-tile-value text-xs">
              {t("add.form.priorSpendHint", {
                amount: priorSpendHint.toLocaleString(),
                year: todayStr.slice(0, 4),
              })}
            </p>
          </div>
        )}

        {!showChit && (
          <div>
            <label className="ct-field-label">{t("commitment.edit.repeat")}</label>
            <select name="repeatType" value={form.repeatType} onChange={onChange} className={fieldClass("repeatType")}>
              {REPEAT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {showChit && (
          <div className="ct-stat-tile amber">
            <p className="ct-stat-tile-value text-xs">{t("add.form.chitRepeatNote")}</p>
          </div>
        )}

        {isOther && (
          <div>
            <label className="ct-field-label">{t("commitment.edit.priority")}</label>
            <select name="priority" value={form.priority} onChange={onChange} className={fieldClass("priority")}>
              {OTHER_PRIORITY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <Caption className="block mt-1 opacity-75">{t("add.form.priorityHint")}</Caption>
          </div>
        )}

        {!isOther && form.category && (
          <div className="ct-inset rounded-lg px-3 py-2 text-xs">
            {t("add.form.priorityAuto", { category })}
          </div>
        )}

        <div>
          <label className="ct-field-label">
            {copy.billName}{" "}
            {showInsurance ? (
              <span className="ct-caption font-normal opacity-75">{t("add.form.nameOptionalInsurance")}</span>
            ) : null}
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder={showInsurance ? t("add.form.namePlaceholderInsurance") : t("add.form.namePlaceholder")}
            className={fieldClass("name")}
          />
          {errors.name && <p className="ct-field-hint ct-text-danger">{errors.name}</p>}
        </div>

        {showInterest && (
          <div>
            <label className="ct-field-label">
              {t("add.form.interestOptional")}{" "}
              <span className="ct-caption font-normal opacity-75">{t("add.form.optional")}</span>
            </label>
            <input
              type="number"
              name="annualInterestRate"
              value={form.annualInterestRate}
              onChange={onChange}
              min="0"
              max="60"
              step="0.1"
              placeholder={t("add.phInterest")}
              className={fieldClass("annualInterestRate")}
            />
          </div>
        )}

        <div>
          <label className="ct-field-label">
            {t("add.form.notesOptional")}{" "}
            <span className="ct-caption font-normal opacity-75">{t("add.form.optional")}</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder={t("add.phNotes")}
            className={`${fieldClass("notes")} min-h-[72px] resize-y`}
          />
        </div>

        <Button type="button" onClick={onSubmit} size="lg" className="ct-add-submit-sticky">
          {copy.addBill}
        </Button>
      </Card>

      {!embedded && affordability && (
        <div className="ct-stat-tile indigo ct-stack-sm">
          <div className="ct-row" style={{ flexWrap: "wrap" }}>
            <Caption className="font-semibold uppercase">{t("add.form.affordability")}</Caption>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${semanticToneToClass(affordabilityTierTone(affordability.tier))}`}
            >
              {affordability.label}
            </span>
          </div>
          <Caption>
            {t("add.form.affordabilityAfter", {
              burden: Math.round(affordability.newTotalBurden).toLocaleString(),
              committed:
                affordability.committedPercent != null ? `${affordability.committedPercent}%` : "—",
              free: Math.round(affordability.freeMoneyAfter).toLocaleString(),
            })}
          </Caption>
          <Caption>{PROFILE_SETTINGS_HINT}</Caption>
        </div>
      )}

      {embedded && affordability && (
        <p
          className={`ct-afford-chip ${semanticToneToClass(affordabilityTierTone(affordability.tier))}`}
        >
          {affordability.label}
        </p>
      )}

      {!embedded && (
        <div className="ct-stat-tile teal ct-stack-sm">
          <p className="ct-body-strong">{t("add.guidanceTitle")}</p>
          <ul className="ct-stack-sm" style={{ fontSize: "0.75rem", color: "var(--ct-accent-muted)", listStyle: "none", padding: 0, margin: 0 }}>
            <li>• {t("add.guidanceDeviceOnly")}</li>
            <li>• {copy.recordPaymentOnBills}</li>
            <li>• {t("add.guidanceEndDate")}</li>
            <li>• {t("add.guidanceRollForward")}</li>
          </ul>
        </div>
      )}
    </>
  );

  if (embedded) return <div className="ct-add-form-embedded ct-form-narrow">{formBody}</div>;

  return (
    <PageShell
      title={copy.addBill}
      subtitle={t("add.newEntry")}
      className="ct-form-narrow"
    >
      {formBody}
    </PageShell>
  );
}
