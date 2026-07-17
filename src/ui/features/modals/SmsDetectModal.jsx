import { useState } from "react";
import { Modal, Card, Button, Caption, Body, inputClassName } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { parseSmsForDebit } from "../../../engines/smsParser.js";
import { matchDebitToCommitment } from "../../../engines/smsCommitmentMatcher.js";
import { isSmsAutoDetectSupported } from "../../../services/smsAutoDetect.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const fieldClass = `${inputClassName()} `;

export default function SmsDetectModal({ open, onClose }) {
  const { t } = useTranslation();
  const { commitments, getEffectiveStatus, addCommitmentPayment } = usePerovo();
  const [sms, setSms] = useState("");
  const [error, setError] = useState("");
  const [match, setMatch] = useState(null);
  const [debit, setDebit] = useState(null);

  const reset = () => {
    setError("");
    setMatch(null);
    setDebit(null);
  };

  const handleDetect = () => {
    reset();
    const parsed = parseSmsForDebit(sms);
    if (!parsed) {
      setError(t("sms.detect.errorFormat"));
      return;
    }
    setDebit(parsed);
    const m = matchDebitToCommitment(parsed, commitments, getEffectiveStatus);
    if (!m) {
      setError(t("sms.detect.noMatch", { amount: formatInr(parsed.amount) }));
      return;
    }
    setMatch(m);
  };

  const handleConfirm = () => {
    if (!match || !debit) return;
    addCommitmentPayment(match.id, {
      amount: debit.amount,
      date: debit.date,
      note: t("sms.detect.noteFromSms"),
    });
    setSms("");
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose} title={t("bills.detectSms")}>
      <div className="ed-stack">
        <div className="flex items-start gap-3">
          <span className="ed-icon-tile" style={{ background: "var(--ed-gold-soft)", color: "var(--ed-gold)" }} aria-hidden>
            <CtIcon name="device-mobile" size={22} />
          </span>
          <Caption>{t("sms.pastePlaceholder")}</Caption>
        </div>

        <textarea
          className={`${fieldClass} min-h-[100px] w-full`}
          value={sms}
          onChange={(e) => {
            setSms(e.target.value);
            reset();
          }}
          placeholder={t("sms.pastePlaceholder")}
        />
        {error ? <Caption className="block text-[var(--ed-red)]">{error}</Caption> : null}

        {match && debit ? (
          <Card variant="flat" className="ed-inset ed-stack-sm">
            <Body className="font-semibold relative">
              {t("sms.detect.confirm", {
                name: match.name,
                amount: formatInr(debit.amount),
                date: debit.date,
              })}
            </Body>
            <div className="flex gap-2 relative">
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                {t("common.cancel")}
              </Button>
              <Button type="button" variant="primary" className="flex-1" onClick={handleConfirm}>
                {t("sms.detect.yesMarkPaid")}
              </Button>
            </div>
          </Card>
        ) : null}

        <Button type="button" variant="primary" onClick={handleDetect}>
          {t("sms.detect.cta")}
        </Button>
        {!isSmsAutoDetectSupported() ? (
          <Caption className="block opacity-80">{t("sms.detect.deviceUnsupported")}</Caption>
        ) : null}
      </div>
    </Modal>
  );
}
