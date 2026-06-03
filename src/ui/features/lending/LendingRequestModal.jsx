import { useMemo, useState } from "react";
import { Modal } from "../../index.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import {
  buildAgreementText,
  borrowerTrustSnapshot,
  buildOfferShareUrl,
  encodeOfferPayload,
} from "../../../engines/lendingAgreement.js";
import { LEGAL_DISCLAIMER } from "../../../constants/plainLanguage.js";
import { INR } from "../../../constants/symbols.js";
import { todayYmd } from "../../../utils/dates.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";

export default function LendingRequestModal({ onClose }) {
  const { lendings, settings, addLending } = useCommitTrack();
  const [step, setStep] = useState("details");
  const [borrowerName, setBorrowerName] = useState(settings.displayName || "");
  const [lenderName, setLenderName] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [dueDate, setDueDate] = useState(todayYmd());
  const [collateral, setCollateral] = useState("");
  const [purpose, setPurpose] = useState("");
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const trust = useMemo(
    () => borrowerTrustSnapshot(lendings, borrowerName.trim() || "You"),
    [lendings, borrowerName]
  );

  const agreementText = useMemo(
    () =>
      buildAgreementText({
        borrowerName: borrowerName.trim() || "Borrower",
        lenderName: lenderName.trim(),
        amount: Number(amount) || 0,
        interestRate: Number(interestRate) || 0,
        dueDate,
        collateral: collateral.trim(),
        purpose: purpose.trim(),
      }),
    [borrowerName, lenderName, amount, interestRate, dueDate, collateral, purpose]
  );

  const goAgreement = () => {
    if (!borrowerName.trim() || !amount || Number(amount) <= 0 || !dueDate) return;
    setStep("agreement");
  };

  const finishAndShare = () => {
    if (!signName.trim() || !agree) return;
    const offerId = `offer-${Date.now()}`;
    const signedAt = Date.now();
    const offer = {
      v: 1,
      offerId,
      borrowerName: borrowerName.trim(),
      lenderName: lenderName.trim(),
      amount: Number(amount),
      interestRate: Number(interestRate) || 0,
      dueDate,
      collateral: collateral.trim(),
      purpose: purpose.trim(),
      agreementText,
      borrowerSignName: signName.trim(),
      borrowerSignedAt: signedAt,
      trustScore: trust.score,
      trustSummary: trust.summary,
      trustOnTime: trust.onTime,
      trustLate: trust.late,
    };

    addLending(
      buildLendingRecord({
        type: "borrowed",
        personName: lenderName.trim() || "Lender (pending)",
        totalAmount: amount,
        dueDate,
        interestRate: Number(interestRate) || 0,
        notes: purpose.trim(),
        extra: {
          agreementText,
          agreementLocked: true,
          agreementAccepted: true,
          agreementAcceptedAt: signedAt,
          offerId,
          borrowerSignName: signName.trim(),
          borrowerSignedAt: signedAt,
          collateralDescription: collateral.trim(),
        },
      })
    );

    const url = buildOfferShareUrl(offer);
    setShareUrl(url);
    try {
      localStorage.setItem(`committrack_offer_${offerId}`, encodeOfferPayload(offer));
    } catch {
      /* ignore */
    }
    setStep("share");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <Modal
      title="Request money (share link)"
      onClose={onClose}
      footer={
        step === "details" ? (
          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold"
            onClick={goAgreement}
          >
            Next: review agreement
          </button>
        ) : step === "agreement" ? (
          <button
            type="button"
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
            disabled={!signName.trim() || !agree}
            onClick={finishAndShare}
          >
            Sign & create link
          </button>
        ) : (
          <button type="button" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold" onClick={onClose}>
            Done
          </button>
        )
      }
    >
      {step === "details" && (
        <div className="space-y-3 text-sm">
          <p className="text-xs text-gray-500">
            Fill what you need. You will sign first, then send a link. The lender sees your trust score before accepting.
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-600">Your name (borrower)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Lender name (optional now)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="Who will lend you"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Amount ({INR})</label>
            <input
              type="number"
              min="1"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-600">Interest % per year</label>
              <input
                type="number"
                min="0"
                max="60"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">Pay back by</label>
              <input
                type="date"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">What is the money for?</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. medical, business stock"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Collateral (optional)</label>
            <textarea
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm min-h-[72px]"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              placeholder="e.g. gold chain, property papers, bike RC"
            />
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
            <p className="font-semibold text-slate-700">Your trust score (on this phone): {trust.score}/100</p>
            <p className="text-slate-600 mt-1">{trust.summary}</p>
            <p className="text-slate-500 mt-1">Late payments lower the score. This travels with the link.</p>
          </div>
        </div>
      )}

      {step === "agreement" && (
        <div className="space-y-3 text-sm">
          <pre className="text-xs whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
            {agreementText}
          </pre>
          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">{LEGAL_DISCLAIMER}</p>
          <div>
            <label className="text-xs font-semibold text-gray-600">Type your full name to sign (borrower)</label>
            <input
              className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder="Same as on ID"
            />
          </div>
          <label className="flex items-start gap-2 text-xs text-gray-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            I have read the agreement and sign as the borrower.
          </label>
        </div>
      )}

      {step === "share" && (
        <div className="space-y-3 text-sm">
          <p className="text-emerald-700 font-medium">Link ready. Send it to your lender.</p>
          <p className="text-xs text-gray-500">
            They open it in CommitTrack, see your trust score, sign, and accept. Your borrowed entry is saved here and
            cannot be deleted until paid or you both agree to cancel.
          </p>
          <input
            readOnly
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs"
            value={shareUrl}
          />
          <button
            type="button"
            onClick={copyLink}
            className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-semibold"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </Modal>
  );
}
