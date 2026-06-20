import { useState } from "react";
import { Button, Caption } from "../index.js";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import {
  BBPS_PAYABLE_CATEGORIES,
  fetchBillDetails,
  isBbpsConfigured,
  payBill,
} from "../../services/bbps/setuBbps.js";

/**
 * @param {{ commitment: object, cycleDue: number, onPaid?: () => void }} props
 */
export function BbpsPayButton({ commitment, cycleDue, onPaid }) {
  const { t } = useTranslation();
  const { updateCommitment, addCommitmentPayment } = usePerovo();
  const [busy, setBusy] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [consumerNumber, setConsumerNumber] = useState(commitment.consumerNumber || "");
  const [billerId, setBillerId] = useState(commitment.billerId || "");

  if (!isBbpsConfigured() || !BBPS_PAYABLE_CATEGORIES.has(commitment.category)) {
    return null;
  }

  const runPay = async () => {
    const cn = consumerNumber.trim();
    const bid = billerId.trim();
    if (!cn || !bid) {
      setShowPrompt(true);
      return;
    }
    setBusy(true);
    updateCommitment(commitment.id, { consumerNumber: cn, billerId: bid });
    const details = await fetchBillDetails({ billerId: bid, consumerNumber: cn });
    if (details.error) {
      setBusy(false);
      return;
    }
    const result = await payBill({
      billerId: bid,
      consumerNumber: cn,
      amount: Number(details.amount || cycleDue || commitment.amount),
    });
    setBusy(false);
    if (result.paymentUrl) {
      window.open(result.paymentUrl, "_blank", "noopener,noreferrer");
      addCommitmentPayment(commitment.id, {
        amount: Number(details.amount || cycleDue || commitment.amount),
        date: new Date().toISOString().slice(0, 10),
      });
      onPaid?.();
    }
  };

  return (
    <div className="ct-stack-sm">
      {showPrompt ? (
        <>
          <Caption>{t("bill.bbpsConsumerPrompt")}</Caption>
          <input
            className="ct-input w-full"
            value={consumerNumber}
            onChange={(e) => setConsumerNumber(e.target.value)}
            placeholder={t("tools.payBills.consumerNumber")}
          />
          <input
            className="ct-input w-full"
            value={billerId}
            onChange={(e) => setBillerId(e.target.value)}
            placeholder={t("tools.payBills.billerId")}
          />
        </>
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={runPay}>
        {t("bill.bbpsPay")}
      </Button>
    </div>
  );
}
