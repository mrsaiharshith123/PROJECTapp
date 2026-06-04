import { useState } from "react";
import { Modal, Card, Button, Caption, Body, inputClassName } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { parseSmsForDebit } from "../../../engines/smsParser.js";
import { matchDebitToCommitment } from "../../../engines/smsCommitmentMatcher.js";
import { isSmsAutoDetectSupported } from "../../../services/smsAutoDetect.js";

export default function SmsDetectModal({ open, onClose }) {
  const { commitments, getEffectiveStatus, addCommitmentPayment } = useCommitTrack();
  const [sms, setSms] = useState("");
  const [error, setError] = useState("");
  const [match, setMatch] = useState(null);
  const [debit, setDebit] = useState(null);
  const inputClass = inputClassName();

  const reset = () => {
    setError("");
    setMatch(null);
    setDebit(null);
  };

  const handleDetect = () => {
    reset();
    const parsed = parseSmsForDebit(sms);
    if (!parsed) {
      setError("Doesn't look like a bank debit SMS.");
      return;
    }
    setDebit(parsed);
    const m = matchDebitToCommitment(parsed, commitments, getEffectiveStatus);
    if (!m) {
      setError(`No matching commitment found for ₹${parsed.amount.toLocaleString("en-IN")}.`);
      return;
    }
    setMatch(m);
  };

  const handleConfirm = () => {
    if (!match || !debit) return;
    addCommitmentPayment(match.id, {
      amount: debit.amount,
      date: debit.date,
      note: "Detected from SMS",
    });
    setSms("");
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <Modal onClose={onClose} title="Detect from SMS">
      <div className="ct-stack">
        <textarea
          className={`${inputClass} min-h-[100px] w-full`}
          value={sms}
          onChange={(e) => {
            setSms(e.target.value);
            reset();
          }}
          placeholder="Paste your bank debit SMS here..."
        />
        {error && <Caption className="block text-[var(--ct-danger)]">{error}</Caption>}
        {match && debit && (
          <Card variant="flat" className="ct-stack-sm">
            <Body className="font-semibold">
              Mark {match.name} (₹{debit.amount.toLocaleString("en-IN")}) as paid on {debit.date}?
            </Body>
            <div className="ct-row">
              <Button type="button" variant="primary" className="flex-1" onClick={handleConfirm}>
                Yes, mark paid
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                Cancel
              </Button>
            </div>
          </Card>
        )}
        <Button type="button" variant="primary" onClick={handleDetect}>
          Detect payment
        </Button>
        {!isSmsAutoDetectSupported() && (
          <Caption className="block opacity-80">On-device auto-read SMS is not available in this browser yet.</Caption>
        )}
      </div>
    </Modal>
  );
}
