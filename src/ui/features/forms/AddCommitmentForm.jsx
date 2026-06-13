import { Card, InfoTip, Button, PageHeader } from "../../index.js";
import { Caption } from "../../primitives/Text.jsx";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import ChitFundFields from "./ChitFundFields.jsx";
import InsuranceFields from "./InsuranceFields.jsx";
import AddVariableSpendInline from "./AddVariableSpendInline.jsx";
import { OTHER_PRIORITY_OPTIONS } from "../../../constants/priority.js";
import { PROFILE_SETTINGS_HINT } from "../../../constants/plainLanguage.js";
import { affordabilityTierTone } from "../../../engines/affordability.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { REPEAT_OPTIONS } from "../../../constants/repeatTypes.js";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCopy } from "../../../i18n/useCopy.js";

export default function AddCommitmentForm({
  entryType,
  onEntryTypeChange,
  onVariableSaved,
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
  salariedFamily,
  priorSpendHint,
  todayStr,
  affordability,
  onChange,
  onChitChange,
  onInsuranceChange,
  onFillEndDate,
  onSubmit,
}) {
  const { t } = useTranslation();
  const copy = useCopy();

  return (
    <div className="ct-page ct-form-narrow">
      <PageHeader title={entryType === "variable" ? t("add.variableTitle") : copy.addBill} eyebrow={t("add.newEntry")} />

      <Card className="ct-stack-lg">
        <SegmentedControl
          options={[
            { id: "scheduled", label: t("add.entryScheduled") },
            { id: "variable", label: t("add.entryVariable") },
          ]}
          value={entryType}
          onChange={onEntryTypeChange}
        />

        {entryType === "variable" ? (
          <AddVariableSpendInline onSaved={onVariableSaved} />
        ) : (
          <>
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
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
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
            {showChit ? "This month's installment (₹)" : "Amount to pay (₹)"}
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
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          {showChit && form.chitInstallmentMode !== "custom" && (
            <p className="text-[11px] text-yellow-800 dark:text-yellow-200 mt-1">
              From chit value and month. Use &quot;fixed amount&quot; in chit details if your group uses a different number.
            </p>
          )}
        </div>

        <div className="ct-grid-2">
          <div>
            <label className="ct-field-label">
              Start date <span className="text-gray-400 font-normal">(when it began)</span>
            </label>
            <input type="date" name="startDate" value={form.startDate} onChange={onChange} className={fieldClass("startDate")} />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="ct-field-label">
              End date{" "}
              <span className="text-gray-400 font-normal">
                {isSubscription ? "(optional — cancel reminder)" : "(optional)"}
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
            {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
          </div>
        </div>

        <div>
          <label className="ct-field-label">Next payment due</label>
          <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} className={fieldClass("dueDate")} />
          {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate}</p>}
          <p className="text-[11px] text-gray-400 mt-1">
            Next payment date (not the same as start). We suggest the next due from your start day and repeat.
          </p>
        </div>

        {priorSpendHint > 0 && (
          <p className="text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg px-3 py-2">
            Est. ~₹{priorSpendHint.toLocaleString()} paid in years before {todayStr.slice(0, 4)} — included in spend
            totals. Record payments this year as you go.
          </p>
        )}

        {!showChit && (
          <div>
            <label className="ct-field-label">Repeat</label>
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
          <p className="text-xs text-yellow-800 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-2">
            Repeats monthly until the chit ends. When a new month starts, your due amount updates to the lower
            installment — you do not change it yourself.
          </p>
        )}

        {isOther && (
          <div>
            <label className="ct-field-label">Priority</label>
            <select name="priority" value={form.priority} onChange={onChange} className={fieldClass("priority")}>
              {OTHER_PRIORITY_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">For other bills, set priority according to urgency.</p>
          </div>
        )}

        {!isOther && form.category && (
          <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/80 rounded-lg px-3 py-2">
            Priority set automatically for {category} bills.
          </p>
        )}

        <div>
          <label className="ct-field-label">
            {copy.billName}{" "}
            {showInsurance ? (
              <span className="text-gray-400 font-normal">(optional — auto from policy)</span>
            ) : null}
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={onChange}
            placeholder={showInsurance ? "Nickname only if you want" : "e.g. Rent, EMI, school fees"}
            className={fieldClass("name")}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {showInterest && (
          <div>
            <label className="ct-field-label">
              Annual interest % <span className="text-gray-400 font-normal">(optional)</span>
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

        {salariedFamily && (
          <div>
            <label className="ct-field-label">
              Who pays this bill? <span className="text-gray-400 font-normal">(optional)</span>
              <InfoTip text={CALC_HELP.householdPayerBillTag} />
            </label>
            <select
              name="householdPayer"
              value={form.householdPayer || ""}
              onChange={onChange}
              className={fieldClass("householdPayer")}
            >
              <option value="">Not tagged</option>
              <option value="primary">Primary / main earner</option>
              <option value="secondary">Second income / partner</option>
              <option value="shared">Shared / joint</option>
            </select>
          </div>
        )}

        <div>
          <label className="ct-field-label">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            placeholder={t("add.phNotes")}
            className={`${fieldClass("notes")} min-h-[72px] resize-y`}
          />
        </div>

        <Button type="button" onClick={onSubmit} size="lg">
          {copy.addBill}
        </Button>
          </>
        )}
      </Card>

      {entryType === "scheduled" && affordability && (
        <Card className="ct-stack-sm ct-insight-accent">
          <div className="ct-row" style={{ flexWrap: "wrap" }}>
            <Caption className="font-semibold uppercase">Affordability</Caption>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${semanticToneToClass(affordabilityTierTone(affordability.tier))}`}
            >
              {affordability.label}
            </span>
          </div>
          <Caption>
            After adding: ~₹{Math.round(affordability.newTotalBurden).toLocaleString()}/mo burden vs income (
            {affordability.committedPercent != null ? `${affordability.committedPercent}%` : "—"} committed). Free
            money ≈ ₹{Math.round(affordability.freeMoneyAfter).toLocaleString()}.
          </Caption>
          <Caption>{PROFILE_SETTINGS_HINT}</Caption>
        </Card>
      )}

      {entryType === "scheduled" && (
      <Card className="ct-insight-accent ct-stack-sm">
        <p className="ct-body-strong">{t("add.guidanceTitle")}</p>
        <ul className="ct-stack-sm" style={{ fontSize: "0.75rem", color: "var(--ct-accent-muted)", listStyle: "none", padding: 0, margin: 0 }}>
          <li>• {t("add.guidanceDeviceOnly")}</li>
          <li>• {copy.recordPaymentOnBills}</li>
          <li>• {t("add.guidanceEndDate")}</li>
          <li>• {t("add.guidanceRollForward")}</li>
        </ul>
      </Card>
      )}
    </div>
  );
}
