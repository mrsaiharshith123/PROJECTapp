import { defaultEndDateFromStart } from "../../../utils/billDates.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepaymentMode } from "../../../i18n/domainLabels.js";

const RELATIONSHIP_TAGS = ["Friend", "Family", "Business", "Other"];
const RELATIONSHIP_KEYS = {
  Friend: "friend",
  Family: "family",
  Business: "business",
  Other: "other",
};

const REPAYMENT_OPTIONS = ["monthly", "weekly", "biweekly", "lumpsum"];

export default function LendingFormFields({ form, setForm, formErrors, fieldClass, todayStr }) {
  const { t } = useTranslation();
  const inputClass = (field) => `${fieldClass(field)} ct-input-tint`;

  const onStartDate = (startDate) => {
    setForm((f) => ({
      ...f,
      startDate,
      endDate: f.endDate || defaultEndDateFromStart(startDate, todayStr),
    }));
  };

  const fillEndIfEmpty = () => {
    if (!form.startDate || form.endDate) return;
    setForm((f) => ({ ...f, endDate: defaultEndDateFromStart(f.startDate, todayStr) }));
  };

  return (
    <div className="ct-stack">
      <div>
        <label className="ct-field-label">{t("lending.form.person")}</label>
        <input
          className={inputClass("personName")}
          value={form.personName}
          onChange={(e) => setForm({ ...form, personName: e.target.value })}
          placeholder={t("lending.form.phName")}
        />
        {formErrors.personName ? (
          <p className="ct-field-error">{formErrors.personName}</p>
        ) : null}
      </div>
      <div>
        <label className="ct-field-label">{t("lending.form.type")}</label>
        <select
          className={inputClass("type")}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="lent">{t("lending.form.typeLent")}</option>
          <option value="borrowed">{t("lending.form.typeBorrowed")}</option>
        </select>
      </div>
      <div>
        <label className="ct-field-label">{t("lending.form.principal")}</label>
        <input
          type="number"
          min="0"
          className={`${inputClass("totalAmount")} ct-numeral`}
          value={form.totalAmount}
          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
        />
        {formErrors.totalAmount ? (
          <p className="ct-field-error">{formErrors.totalAmount}</p>
        ) : null}
      </div>
      <div>
        <label className="ct-field-label">{t("lending.form.dueDate")}</label>
        <input
          type="date"
          className={inputClass("dueDate")}
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        {formErrors.dueDate ? <p className="ct-field-error">{formErrors.dueDate}</p> : null}
      </div>
      <div className="ct-grid-2">
        <div>
          <label className="ct-field-label">{t("lending.form.interestRate")}</label>
          <input
            type="number"
            min="0"
            max="60"
            step="0.1"
            className={`${inputClass("interestRate")} ct-numeral`}
            value={form.interestRate}
            onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
          />
          {formErrors.interestRate ? (
            <p className="ct-field-error">{formErrors.interestRate}</p>
          ) : null}
        </div>
        <div>
          <label className="ct-field-label">{t("lending.form.interestType")}</label>
          <select
            className={inputClass("interestType")}
            value={form.interestType}
            onChange={(e) => setForm({ ...form, interestType: e.target.value })}
          >
            <option value="simple">{t("lending.form.interestSimple")}</option>
            <option value="compound">{t("lending.form.interestCompound")}</option>
          </select>
        </div>
      </div>
      <div>
        <label className="ct-field-label">{t("lending.form.repaymentFrequency")}</label>
        <select
          className={inputClass("repaymentFrequency")}
          value={form.repaymentFrequency}
          onChange={(e) =>
            setForm({ ...form, repaymentFrequency: e.target.value, repaymentType: e.target.value })
          }
        >
          {REPAYMENT_OPTIONS.map((mode) => (
            <option key={mode} value={mode}>
              {translateRepaymentMode(t, mode)}
            </option>
          ))}
        </select>
        <p className="ct-caption block mt-1 opacity-75">{t("lending.form.repaymentHint")}</p>
      </div>
      <div className="ct-grid-2">
        <div>
          <label className="ct-field-label">{t("lending.form.start")}</label>
          <input
            type="date"
            className={inputClass("startDate")}
            value={form.startDate}
            onChange={(e) => onStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="ct-field-label">{t("lending.form.end")}</label>
          <input
            type="date"
            className={inputClass("endDate")}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            onFocus={fillEndIfEmpty}
          />
        </div>
      </div>
      <div>
        <label className="ct-field-label">{t("lending.form.relationship")}</label>
        <select
          className={inputClass("relationshipTag")}
          value={form.relationshipTag}
          onChange={(e) => setForm({ ...form, relationshipTag: e.target.value })}
        >
          {RELATIONSHIP_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {t(`lending.relationship.${RELATIONSHIP_KEYS[tag]}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="ct-field-label">{t("lending.form.notes")}</label>
        <textarea
          className={`${inputClass("notes")} min-h-[72px]`}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </div>
  );
}
