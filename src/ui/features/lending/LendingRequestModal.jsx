import { useMemo, useState } from "react";
import { Modal, Button, Caption, Body, ToneSurface, inputClassName } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
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
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

export default function LendingRequestModal({ onClose }) {
  const { t } = useTranslation();
  const { lendings, settings, addLending } = usePerovo();
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
    [lendings, borrowerName],
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
    [borrowerName, lenderName, amount, interestRate, dueDate, collateral, purpose],
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
      }),
    );

    const url = buildOfferShareUrl(offer);
    setShareUrl(url);
    try {
      localStorage.setItem(`perovo_offer_${offerId}`, encodeOfferPayload(offer));
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
      title={t("lending.request.title")}
      onClose={onClose}
      footer={
        step === "details" ? (
          <Button type="button" variant="primary" className="w-full" onClick={goAgreement}>
            {t("lending.request.nextAgreement")}
          </Button>
        ) : step === "agreement" ? (
          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={!signName.trim() || !agree}
            onClick={finishAndShare}
          >
            {t("lending.request.signCreate")}
          </Button>
        ) : (
          <Button type="button" variant="primary" className="w-full" onClick={onClose}>
            {t("lending.request.done")}
          </Button>
        )
      }
    >
      {step === "details" && (
        <div className="ct-stack">
          <Caption className="block">{t("lending.request.intro")}</Caption>
          <div>
            <label className="ct-field-label">{t("lending.request.borrowerName")}</label>
            <input className={fieldClass} value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
          </div>
          <div>
            <label className="ct-field-label">{t("lending.request.lenderName")}</label>
            <input
              className={fieldClass}
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder={t("lending.form.phLender")}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("lending.request.amount", { currency: INR })}</label>
            <input
              type="number"
              min="1"
              className={`${fieldClass} ct-numeral`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="ct-grid-2">
            <div>
              <label className="ct-field-label">{t("lending.request.interest")}</label>
              <input
                type="number"
                min="0"
                max="60"
                className={`${fieldClass} ct-numeral`}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div>
              <label className="ct-field-label">{t("lending.request.payBackBy")}</label>
              <input type="date" className={fieldClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="ct-field-label">{t("lending.request.purpose")}</label>
            <input
              className={fieldClass}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t("lending.form.phPurpose")}
            />
          </div>
          <div>
            <label className="ct-field-label">{t("lending.request.collateral")}</label>
            <textarea
              className={`${fieldClass} min-h-[72px]`}
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              placeholder={t("lending.form.phCollateral")}
            />
          </div>
          <div className="ct-stat-tile indigo !p-3">
            <div className="ct-row gap-2 items-start">
              <span className="ct-icon-tile indigo shrink-0" aria-hidden>
                <CtIcon name="shield" size={18} context="status" />
              </span>
              <div>
                <Body className="!text-sm font-semibold">
                  {t("lending.request.trustTitle", { score: trust.score })}
                </Body>
                <Caption className="block mt-1">{trust.summary}</Caption>
                <Caption className="block mt-1 opacity-80">{t("lending.request.trustHint")}</Caption>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "agreement" && (
        <div className="ct-stack">
          <pre className="ct-inset text-xs whitespace-pre-wrap max-h-48 overflow-y-auto !p-3">{agreementText}</pre>
          <ToneSurface tone="warning">
            <Caption className="block">{LEGAL_DISCLAIMER}</Caption>
          </ToneSurface>
          <div>
            <label className="ct-field-label">{t("lending.request.signBorrower")}</label>
            <input
              className={fieldClass}
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder={t("lending.form.phSignName")}
            />
          </div>
          <label className="ct-row gap-2 items-start ct-caption">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            {t("lending.request.agreeBorrower")}
          </label>
        </div>
      )}

      {step === "share" && (
        <div className="ct-stack">
          <div className="ct-stat-tile teal !p-3">
            <Body className="!text-sm font-semibold ct-text-success">{t("lending.request.linkReady")}</Body>
            <Caption className="block mt-1">{t("lending.request.shareHint")}</Caption>
          </div>
          <input readOnly className={`${fieldClass} text-xs`} value={shareUrl} />
          <Button type="button" variant="outline" className="w-full" onClick={copyLink}>
            {copied ? t("lending.request.copied") : t("lending.request.copyLink")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
