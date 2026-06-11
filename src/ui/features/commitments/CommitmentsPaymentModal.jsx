import { Modal } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

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

  return (
    <Modal
      title={t("bills.payThisMonth")}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onPay}
          disabled={installmentAmount <= 0 || cycleAlreadyPaid}
          className="w-full py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40"
        >
          {t("bills.markPaid")}
        </button>
      }
    >
      <div>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{paymentFor.name}</span>
          {contractStillToPay > installmentAmount && installmentAmount > 0 ? (
            <>
              {" "}
              {"\u2014"} total left on contract{" "}
              <span className="font-bold">
                {"\u20b9"}
                {contractStillToPay.toLocaleString("en-IN")}
              </span>
              {" "}
              · paying this month{" "}
              <span className="font-bold">
                {"\u20b9"}
                {installmentAmount.toLocaleString("en-IN")}
              </span>
            </>
          ) : (
            <>
              {" "}
              {"\u2014"} this payment{" "}
              <span className="font-bold">
                {"\u20b9"}
                {installmentAmount.toLocaleString("en-IN")}
              </span>
            </>
          )}
        </p>
        {cycleAlreadyPaid ? (
          <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 mt-3">
            {t("bills.alreadyPaidMonth")}
          </p>
        ) : (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {t("bills.installmentFixed")}
            </label>
            <p
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-lg font-bold text-gray-900"
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {"\u20b9"}
              {installmentAmount.toLocaleString("en-IN")}
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">{t("bills.date")}</label>
          <input
            type="date"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={payDate}
            onChange={(e) => onPayDateChange(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
