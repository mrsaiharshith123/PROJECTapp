import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card } from "../../";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { decodeOfferPayload, trustScoreLabel } from "../../../engines/lendingAgreement.js";
import { LEGAL_DISCLAIMER } from "../../../constants/plainLanguage.js";
import { formatInr } from "../../../constants/symbols.js";
import { trustScoreToTone } from "../../../engines/lendingTrust.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

export default function LendingOfferReview() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { addLending, settings } = useCommitTrack();
  const [lenderName, setLenderName] = useState(settings.displayName || "");
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const offer = useMemo(() => decodeOfferPayload(params.get("d")), [params]);

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 px-4 py-10 max-w-lg mx-auto">
        <Card className="text-center py-10 space-y-3">
          <p className="text-lg font-semibold text-gray-800">Link not valid</p>
          <p className="text-sm text-gray-500">{t("lending.offer.invalidLink")}</p>
          <Link to="/" className="text-sm font-semibold text-indigo-600">
            Go to app home
          </Link>
        </Card>
      </div>
    );
  }

  const score = Number(offer.trustScore) || 50;
  const label = trustScoreLabel(score);

  const acceptLoan = () => {
    if (!signName.trim() || !agree) return;
    const signedAt = Date.now();
    addLending(
      buildLendingRecord({
        type: "lent",
        personName: offer.borrowerName,
        totalAmount: offer.amount,
        dueDate: offer.dueDate,
        interestRate: offer.interestRate || 0,
        notes: offer.purpose || "",
        extra: {
          agreementText: offer.agreementText,
          agreementLocked: true,
          agreementAccepted: true,
          agreementAcceptedAt: signedAt,
          offerId: offer.offerId,
          borrowerSignName: offer.borrowerSignName,
          borrowerSignedAt: offer.borrowerSignedAt,
          lenderSignName: signName.trim(),
          lenderSignedAt: signedAt,
          collateralDescription: offer.collateral || "",
        },
      })
    );
    setAccepted(true);
  };

  if (accepted) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 px-4 py-10 max-w-lg mx-auto space-y-4">
        <Card className="text-center py-8 space-y-2">
          <p className="text-2xl">&#10003;</p>
          <p className="text-lg font-semibold text-emerald-700">You accepted the loan</p>
          <p className="text-sm text-gray-500">
            Saved on this device as money you lent to {offer.borrowerName}. It stays until repaid or you both sign to
            cancel.
          </p>
          <Link to="/lending" className="inline-block mt-4 text-sm font-semibold text-indigo-600">
            Open lending tracker
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 px-4 py-8 max-w-lg mx-auto space-y-4">
      <div>
        <p className="text-sm text-gray-400 uppercase tracking-widest">Loan request</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          {offer.borrowerName} wants to borrow
        </h1>
        <p className="text-3xl font-bold text-indigo-600 mt-2">{formatInr(offer.amount)}</p>
      </div>

      <Card className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase">Trust score</p>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${semanticToneToClass(trustScoreToTone(score))}`}>
            {score}/100 · {label}
          </span>
        </div>
        <p className="text-xs text-gray-600">{offer.trustSummary}</p>
        {(offer.trustOnTime > 0 || offer.trustLate > 0) && (
          <p className="text-[11px] text-gray-500">
            On-time payments: {offer.trustOnTime} · Late: {offer.trustLate}
          </p>
        )}
      </Card>

      <Card className="space-y-2 text-sm">
        <p>
          <span className="text-gray-500">Interest:</span> {offer.interestRate}% per year
        </p>
        <p>
          <span className="text-gray-500">Pay back by:</span> {offer.dueDate}
        </p>
        {offer.purpose ? (
          <p>
            <span className="text-gray-500">For:</span> {offer.purpose}
          </p>
        ) : null}
        {offer.collateral ? (
          <p>
            <span className="text-gray-500">Collateral:</span> {offer.collateral}
          </p>
        ) : null}
        <p className="text-xs text-gray-500">
          Borrower signed: {offer.borrowerSignName} (
          {new Date(offer.borrowerSignedAt).toLocaleString("en-IN", { dateStyle: "medium" })})
        </p>
      </Card>

      <Card>
        <p className="text-xs font-semibold text-gray-500 mb-2">Agreement</p>
        <pre className="text-[11px] whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto border border-gray-100">
          {offer.agreementText}
        </pre>
      </Card>

      <Card className="space-y-3">
        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">{LEGAL_DISCLAIMER}</p>
        <div>
          <label className="text-xs font-semibold text-gray-600">Your name (lender)</label>
          <input
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={lenderName}
            onChange={(e) => setLenderName(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600">Type full name to sign & accept</label>
          <input
            className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
            value={signName}
            onChange={(e) => setSignName(e.target.value)}
          />
        </div>
        <label className="flex items-start gap-2 text-xs text-gray-700">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
          I agree to lend on these terms and sign as lender.
        </label>
        <button
          type="button"
          disabled={!signName.trim() || !agree}
          onClick={acceptLoan}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm disabled:opacity-50"
        >
          Accept & save on my phone
        </button>
      </Card>
    </div>
  );
}
