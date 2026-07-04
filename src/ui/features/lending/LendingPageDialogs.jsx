import { Modal, Button, Caption, inputClassName } from "../../index.js";
import LendingDetailModal from "../modals/LendingDetailModal.jsx";
import LendingFormFields from "./LendingFormFields.jsx";
import LendingRequestModal from "./LendingRequestModal.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepaymentMode } from "../../../i18n/domainLabels.js";
import { formatInr } from "../../../constants/symbols.js";

const payFieldClass = `${inputClassName()} `;

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
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" className="flex-1" onClick={onCloseAdd}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="primary" className="flex-1" onClick={onSubmitAdd}>
                {t("common.save")}
              </Button>
            </div>
          }
        >
          <LendingFormFields
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            fieldClass={fieldClass}
            todayStr={todayStr}
          />
        </Modal>
      )}

      {editing && (
        <Modal
          title={t("lending.editEntry")}
          onClose={onCloseEdit}
          footer={
            <div className="flex gap-2 w-full">
              <Button type="button" variant="outline" className="flex-1" onClick={onCloseEdit}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="primary" className="flex-1" onClick={onSubmitEdit}>
                {t("common.save")}
              </Button>
            </div>
          }
        >
          <LendingFormFields
            form={form}
            setForm={setForm}
            formErrors={formErrors}
            fieldClass={fieldClass}
            todayStr={todayStr}
          />
        </Modal>
      )}

      {showRequest && <LendingRequestModal onClose={onCloseRequest} />}

      {detailFor && <LendingDetailModal lending={detailFor} onClose={onCloseDetail} />}

      {paymentFor && (
        <Modal
          title={t("lending.recordRepayment")}
          onClose={onClosePayment}
          footer={
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button type="button" variant="primary" className="flex-1" onClick={onSubmitPayment}>
                {t("lending.payment.addAmount")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onPayRemaining}
                disabled={Number(paymentFor.remainingAmount) <= 0}
              >
                {t("lending.payment.payFull", {
                  amount: formatInr(Number(paymentFor.remainingAmount) || 0),
                })}
              </Button>
            </div>
          }
        >
          <div className="ed-stack">
            <div className="ed-inset ed-stack-sm">
              <Caption className="block">
                {t("lending.payment.remainingLine", {
                  name: paymentFor.personName,
                  amount: formatInr(Number(paymentFor.remainingAmount) || 0),
                })}
              </Caption>
              <Caption className="block opacity-80">
                {t("lending.payment.hint", {
                  mode: translateRepaymentMode(t, paymentFor.repaymentType || paymentFor.repaymentFrequency),
                })}
              </Caption>
            </div>
            <div>
              <label className="ed-field-label">{t("lending.payment.amountLabel")}</label>
              <input
                type="number"
                min="0"
                className={`${payFieldClass} ed-numeral`}
                value={payAmount}
                onChange={(e) => onPayAmountChange(e.target.value)}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("lending.payment.dateLabel")}</label>
              <input
                type="date"
                className={payFieldClass}
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
