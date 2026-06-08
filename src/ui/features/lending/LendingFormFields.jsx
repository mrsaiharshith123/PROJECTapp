import { defaultEndDateFromStart } from "../../../utils/billDates.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const RELATIONSHIP_TAGS = ["Friend", "Family", "Business", "Other"];

export default function LendingFormFields({ form, setForm, formErrors, fieldClass, todayStr }) {
  const { t } = useTranslation();
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
    <>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Person</label>
        <input
          className={fieldClass("personName")}
          value={form.personName}
          onChange={(e) => setForm({ ...form, personName: e.target.value })}
          placeholder={t("lending.form.phName")}
        />
        {formErrors.personName && <p className="text-xs text-red-500 mt-1">{formErrors.personName}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
        <select
          className={fieldClass("type")}
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="lent">I lent money</option>
          <option value="borrowed">I borrowed money</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Principal (₹)</label>
        <input
          type="number"
          min="0"
          className={fieldClass("totalAmount")}
          value={form.totalAmount}
          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
        />
        {formErrors.totalAmount && <p className="text-xs text-red-500 mt-1">{formErrors.totalAmount}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Due date</label>
        <input
          type="date"
          className={fieldClass("dueDate")}
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
        />
        {formErrors.dueDate && <p className="text-xs text-red-500 mt-1">{formErrors.dueDate}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Interest rate % *</label>
          <input
            type="number"
            min="0"
            max="60"
            step="0.1"
            className={fieldClass("interestRate")}
            value={form.interestRate}
            onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
          />
          {formErrors.interestRate && <p className="text-xs text-red-500 mt-1">{formErrors.interestRate}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Interest type</label>
          <select
            className={fieldClass("interestType")}
            value={form.interestType}
            onChange={(e) => setForm({ ...form, interestType: e.target.value })}
          >
            <option value="simple">Simple</option>
            <option value="compound">Compound (EMI)</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Repayment frequency</label>
        <select
          className={fieldClass("repaymentFrequency")}
          value={form.repaymentFrequency}
          onChange={(e) =>
            setForm({ ...form, repaymentFrequency: e.target.value, repaymentType: e.target.value })
          }
        >
          <option value="monthly">Monthly installments</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="lumpsum">Flexible — pay anytime (partial or full)</option>
        </select>
        <p className="text-[10px] text-gray-400 mt-1">
          Flexible suits informal loans; monthly builds an EMI-style schedule.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Start</label>
          <input
            type="date"
            className={fieldClass("startDate")}
            value={form.startDate}
            onChange={(e) => onStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">End</label>
          <input
            type="date"
            className={fieldClass("endDate")}
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            onFocus={fillEndIfEmpty}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Relationship</label>
        <select
          className={fieldClass("relationshipTag")}
          value={form.relationshipTag}
          onChange={(e) => setForm({ ...form, relationshipTag: e.target.value })}
        >
          {RELATIONSHIP_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
        <textarea
          className={`${fieldClass("notes")} min-h-[72px]`}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>
    </>
  );
}
