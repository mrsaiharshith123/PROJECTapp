import { Modal } from "../../index.js";
import LendingDetailModal from "../modals/LendingDetailModal.jsx";
import LendingFormFields from "./LendingFormFields.jsx";
import LendingRequestModal from "./LendingRequestModal.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepaymentMode } from "../../../i18n/domainLabels.js";

export default function LendingPageDialogs({
  showAdd,
  onCloseAdd,
  editing,
  onCloseEdit,
  showRequest,
  onCloseRequest,
  detailFor,
  onCloseDetail,
  paymentFor,
  onClosePayment,
  form,
  setForm,
  formErrors,
  fieldClass,
  todayStr,
  payAmount,
  onPayAmountChange,
  payDate,
  onPayDateChange,
  onSubmitAdd,
  onSubmitEdit,
  onSubmitPayment,
  onPayRemaining,
}) {
  const { t } = useTranslation();

  return (
    <>
      {showAdd && (
        <Modal
          title={t("lending.addEntry")}
          onClose={onCloseAdd}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 bg-white"
                onClick={onCloseAdd}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
                onClick={onSubmitAdd}
              >
                {t("common.save")}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <LendingFormFields
              form={form}
              setForm={setForm}
              formErrors={formErrors}
              fieldClass={fieldClass}
              todayStr={todayStr}
            />
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title={t("lending.editEntry")}
          onClose={onCloseEdit}
          footer={
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl"
                onClick={onCloseEdit}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl"
                onClick={onSubmitEdit}
              >
                {t("common.save")}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <LendingFormFields
              form={form}
              setForm={setForm}
              formErrors={formErrors}
              fieldClass={fieldClass}
              todayStr={todayStr}
            />
          </div>
        </Modal>
      )}

      {showRequest && <LendingRequestModal onClose={onCloseRequest} />}

      {detailFor && <LendingDetailModal lending={detailFor} onClose={onCloseDetail} />}

      {paymentFor && (
        <Modal
          title={t("lending.recordRepayment")}
          onClose={onClosePayment}
          footer={
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={onSubmitPayment}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 rounded-xl"
              >
                {t("lending.payment.addAmount")}
              </button>
              <button
                type="button"
                onClick={onPayRemaining}
                disabled={Number(paymentFor.remainingAmount) <= 0}
                className="flex-1 py-2.5 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-xl disabled:opacity-40"
              >
                {t("lending.payment.payFull", {
                  amount: `₹${Number(paymentFor.remainingAmount).toLocaleString()}`,
                })}
              </button>
            </div>
          }
        >
          <div>
            <p className="text-sm text-gray-600">
              {t("lending.payment.remainingLine", {
                name: paymentFor.personName,
                amount: `₹${Number(paymentFor.remainingAmount).toLocaleString()}`,
              })}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {t("lending.payment.hint", {
                mode: translateRepaymentMode(t, paymentFor.repaymentType || paymentFor.repaymentFrequency),
              })}
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t("lending.payment.amountLabel")}
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={payAmount}
                onChange={(e) => onPayAmountChange(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {t("lending.payment.dateLabel")}
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={payDate}
                onChange={(e) => onPayDateChange(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
