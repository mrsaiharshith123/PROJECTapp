import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Caption, inputClassName } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isValidInviteCode, normalizeInviteCode } from "../../../utils/inviteCode.js";
import { decodeOfferPayload } from "../../../engines/lendingAgreement.js";
import { loadLendingOffer } from "../../../services/lending/offerRegistry.js";

const fieldClass = `${inputClassName()} `;

/** Lender enters a 6-character offer code from the borrower. */
export default function LendingAcceptCodeModal({ onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const raw = code.trim();
    if (raw.length > 8) {
      const decoded = decodeOfferPayload(raw);
      if (decoded) {
        onClose();
        navigate(`/lend/offer?d=${encodeURIComponent(raw)}`);
        return;
      }
    }
    const normalized = normalizeInviteCode(raw);
    if (!isValidInviteCode(normalized)) {
      setError(t("lending.acceptCode.invalidFormat"));
      return;
    }
    if (!loadLendingOffer(normalized)) {
      setError(t("lending.acceptCode.notFound"));
      return;
    }
    onClose();
    navigate(`/lend/offer?code=${normalized}`);
  };

  return (
    <Modal
      title={t("lending.acceptCode.title")}
      onClose={onClose}
      footer={
        <Button type="button" variant="primary" className="w-full" onClick={submit}>
          {t("lending.acceptCode.continue")}
        </Button>
      }
    >
      <div className="ed-stack">
        <Caption className="block">{t("lending.acceptCode.intro")}</Caption>
        <div>
          <label className="ed-field-label" htmlFor="lend-offer-code">
            {t("lending.acceptCode.label")}
          </label>
          <input
            id="lend-offer-code"
            className={`${fieldClass} ed-numeral uppercase tracking-widest text-center text-lg`}
            value={code}
            onChange={(e) => {
              setCode(normalizeInviteCode(e.target.value));
              setError("");
            }}
            maxLength={6}
            autoComplete="off"
            inputMode="text"
            placeholder={t("lending.acceptCode.placeholder")}
          />
        </div>
        {error ? <p className="ed-caption text-[var(--ed-red)]">{error}</p> : null}
      </div>
    </Modal>
  );
}
