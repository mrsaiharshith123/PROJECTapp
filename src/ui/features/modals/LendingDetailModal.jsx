import { useRef, useState } from "react";
import { Modal, Button, inputClassName } from "../../../ui";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import LendingDetailDashboard from "../lending/LendingDetailDashboard.jsx";
import { EngineGuard } from "../../primitives/EngineGuard.jsx";
import { todayYmd } from "../../../utils/dates.js";

const RELATIONSHIP_TAGS = ["friend", "family", "business", "other"];
const DISPUTE_STATUSES = ["none", "open", "resolved"];
const fieldClass = `${inputClassName()} `;

const MAX_PROOF_BYTES = 400_000;

export default function LendingDetailModal({ lending, onClose }) {
  const { t } = useTranslation();
  const { updateLending, addLendingPayment } = usePerovo();
  const fileRef = useRef(null);
  const [agreementDraft, setAgreementDraft] = useState(lending.agreementText || "");

  const addProof = (file) => {
    if (!file || file.size > MAX_PROOF_BYTES) {
      alert(t("lending.proof.sizeLimit"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const uri = String(reader.result || "");
      const next = [
        ...(lending.proofs || []),
        { type: "image", uri, date: todayYmd(), label: file.name.slice(0, 60) },
      ];
      updateLending(lending.id, { proofs: next });
    };
    reader.readAsDataURL(file);
  };

  const simulateUpiPay = () => {
    const rem = Number(lending.remainingAmount) || 0;
    if (rem <= 0) return;
    addLendingPayment(lending.id, { amount: rem, date: todayYmd() });
    onClose();
  };

  const acceptAgreement = () => {
    updateLending(lending.id, {
      agreementAccepted: true,
      agreementAcceptedAt: Date.now(),
      agreementText: agreementDraft,
    });
  };

  return (
    <Modal title={lending.personName} onClose={onClose}>
      <div className="max-h-[75vh] overflow-y-auto pb-2 ed-inset">
        <EngineGuard>
          <LendingDetailDashboard
            lending={lending}
            agreementDraft={agreementDraft}
            setAgreementDraft={setAgreementDraft}
            onSimulatePay={simulateUpiPay}
            onAcceptAgreement={acceptAgreement}
            fileRef={fileRef}
            onAddProof={addProof}
          />
        </EngineGuard>
        <div className="mt-4 ed-stack-sm ed-inset">
          <label className="ed-field-label">{t("lending.form.relationship")}</label>
          <select
            className={fieldClass}
            value={lending.relationshipTag || "Other"}
            onChange={(e) => updateLending(lending.id, { relationshipTag: e.target.value })}
          >
            {RELATIONSHIP_TAGS.map((tag) => (
              <option key={tag} value={tag.charAt(0).toUpperCase() + tag.slice(1)}>
                {t(`lending.relationship.${tag}`)}
              </option>
            ))}
          </select>
          <label className="ed-field-label">{t("lending.dispute.label")}</label>
          <select
            className={fieldClass}
            value={lending.disputeStatus || "none"}
            onChange={(e) => updateLending(lending.id, { disputeStatus: e.target.value })}
          >
            {DISPUTE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`lending.dispute.${status}`)}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" className="w-full mt-3" onClick={onClose}>
          {t("common.close")}
        </Button>
      </div>
    </Modal>
  );
}
