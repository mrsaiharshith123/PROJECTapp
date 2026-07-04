import { Modal, Button, Caption, inputClassName } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";

const fieldClass = `${inputClassName()} `;

export default function CommitmentsPaymentModal({
  paymentFor,
  installmentAmount,
  contractStillToPay,
  cycleAlreadyPaid,
  payDate,
  onPayDateChange,
  onPay,
  onClose,
}) {
  const { t } = useTranslation();
  if (!paymentFor) return null;

  const installmentDisplay = formatInr(installmentAmount);
  const contractDisplay = formatInr(contractStillToPay);

  return (
    <Modal
      title={t("bills.payThisMonth")}
      onClose={onClose}
      footer={
        <Button
          type="button"
          variant="primary"
          className="w-full"
          onClick={onPay}
          disabled={installmentAmount <= 0 || cycleAlreadyPaid}
        >
          {t("bills.markPaid")}
        </Button>
      }
    >
      <div className="ed-stack">
        <div className="ed-inset-amber ed-stack-sm">
          <Caption className="block">
            <span className="font-semibold text-[var(--ed-ink)]">{paymentFor.name}</span>
            {contractStillToPay > installmentAmount && installmentAmount > 0 ? (
              <>
                {" "}
                {t("bills.totalLeftOnContract", { amount: contractDisplay })}{" "}
                {t("bills.payingThisMonth", { amount: installmentDisplay })}
              </>
            ) : (
              <> {t("bills.thisPayment", { amount: installmentDisplay })}</>
            )}
          </Caption>
        </div>
        {cycleAlreadyPaid ? (
          <div className="ed-inset-green">
            <Caption className="block">{t("bills.alreadyPaidMonth")}</Caption>
          </div>
        ) : (
          <div className="ed-inset-amber">
            <label className="ed-stat-label">{t("bills.installmentFixed")}</label>
            <p className="ed-stat-value ed-numeral">{installmentDisplay}</p>
          </div>
        )}
        <div>
          <label className="ed-field-label">{t("bills.date")}</label>
          <input type="date" className={fieldClass} value={payDate} onChange={(e) => onPayDateChange(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
