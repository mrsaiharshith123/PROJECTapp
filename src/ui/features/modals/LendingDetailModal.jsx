import { useRef, useState } from "react";
import { Modal } from "../../../ui";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import LendingDetailDashboard from "../lending/LendingDetailDashboard.jsx";
import { todayYmd } from "../../../utils/dates.js";

const MAX_PROOF_BYTES = 400_000;

export default function LendingDetailModal({ lending, onClose }) {
  const { updateLending, addLendingPayment } = useCommitTrack();
  const fileRef = useRef(null);
  const [agreementDraft, setAgreementDraft] = useState(lending.agreementText || "");

  const addProof = (file) => {
    if (!file || file.size > MAX_PROOF_BYTES) {
      alert("Image must be under 400KB for local storage.");
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
      <div className="max-h-[75vh] overflow-y-auto pb-2">
        <LendingDetailDashboard
          lending={lending}
          agreementDraft={agreementDraft}
          setAgreementDraft={setAgreementDraft}
          onSimulatePay={simulateUpiPay}
          onAcceptAgreement={acceptAgreement}
          fileRef={fileRef}
          onAddProof={addProof}
        />
        <div className="mt-4 flex gap-2">
          <select
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={lending.relationshipTag || "Other"}
            onChange={(e) => updateLending(lending.id, { relationshipTag: e.target.value })}
          >
            {["Friend", "Family", "Business", "Other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm"
            value={lending.disputeStatus || "none"}
            onChange={(e) => updateLending(lending.id, { disputeStatus: e.target.value })}
          >
            <option value="none">No dispute</option>
            <option value="open">Open dispute</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
