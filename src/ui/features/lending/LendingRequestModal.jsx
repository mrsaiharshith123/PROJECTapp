import { useMemo, useState } from "react";
import { Modal, Button, Caption, Body, ToneSurface } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { buildAgreementText } from "../../../engines/lendingAgreement.js";
import { LEGAL_DISCLAIMER } from "../../../constants/plainLanguage.js";
import { INR } from "../../../constants/symbols.js";
import { todayYmd } from "../../../utils/dates.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { saveLendingOffer } from "../../../services/lending/offerRegistry.js";
import { encodeOfferPayload } from "../../../engines/lendingAgreement.js";
import { phoneLast10 } from "../../../utils/sanitize.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

const inputClass = (hasError = false) => `ed-input${hasError ? " error" : ""}`;

export default function LendingRequestModal({ onClose }) {
  const { t } = useTranslation();
  const { settings, addLending } = usePerovo();
  const [step, setStep] = useState("details");
  const [borrowerName, setBorrowerName] = useState(settings.displayName || "");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [lenderName, setLenderName] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [dueDate, setDueDate] = useState(todayYmd());
  const [collateral, setCollateral] = useState("");
  const [purpose, setPurpose] = useState("");
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [offerPacket, setOfferPacket] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedPacket, setCopiedPacket] = useState(false);

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
    if (phoneLast10(requesterPhone).length !== 10) return;
    setStep("agreement");
  };

  const finishAndShare = () => {
    if (!signName.trim() || !agree) return;
    const signedAt = Date.now();
    const offer = {
      v: 1,
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
      requesterPhone: requesterPhone.trim(),
    };

    const code = saveLendingOffer(offer);
    const packet = encodeOfferPayload({ ...offer, offerCode: code, offerId: code });

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
          offerId: code,
          offerCode: code,
          borrowerSignName: signName.trim(),
          borrowerSignedAt: signedAt,
          collateralDescription: collateral.trim(),
        },
      }),
    );

    setOfferCode(code);
    setOfferPacket(packet);
    setStep("share");
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(offerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const copyPacket = async () => {
    try {
      await navigator.clipboard.writeText(offerPacket);
      setCopiedPacket(true);
      setTimeout(() => setCopiedPacket(false), 2000);
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
        <div className="ed-stack" style={{ gap: 12 }}>
          <Caption className="block">{t("lending.request.intro")}</Caption>
          <div>
            <label className="ed-field-label">{t("lending.request.borrowerName")}</label>
            <input className={inputClass()} value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} />
          </div>
          <div>
            <label className="ed-field-label">{t("lending.request.yourPhone")}</label>
            <input
              type="tel"
              className={inputClass()}
              value={requesterPhone}
              onChange={(e) => setRequesterPhone(e.target.value)}
              placeholder={t("lending.request.yourPhonePh")}
            />
            <Caption className="block mt-1 opacity-80">{t("lending.request.yourPhoneHint")}</Caption>
          </div>
          <div>
            <label className="ed-field-label">{t("lending.request.lenderName")}</label>
            <input
              className={inputClass()}
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder={t("lending.form.phLender")}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("lending.request.amount", { currency: INR })}</label>
            <input
              type="number"
              min="1"
              className={inputClass()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="ed-grid-2">
            <div>
              <label className="ed-field-label">{t("lending.request.interest")}</label>
              <input
                type="number"
                min="0"
                max="60"
                className={inputClass()}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div>
              <label className="ed-field-label">{t("lending.request.payBackBy")}</label>
              <input type="date" className={inputClass()} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="ed-field-label">{t("lending.request.purpose")}</label>
            <input
              className={inputClass()}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder={t("lending.form.phPurpose")}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("lending.request.collateral")}</label>
            <textarea
              className="ed-textarea"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              placeholder={t("lending.form.phCollateral")}
            />
          </div>
        </div>
      )}

      {step === "agreement" && (
        <div className="ed-stack" style={{ gap: 12 }}>
          <pre className="ed-inset text-xs whitespace-pre-wrap max-h-48 overflow-y-auto !p-3">{agreementText}</pre>
          <ToneSurface tone="warning">
            <Caption className="block">{LEGAL_DISCLAIMER}</Caption>
          </ToneSurface>
          <div>
            <label className="ed-field-label">{t("lending.request.signBorrower")}</label>
            <input
              className={inputClass()}
              value={signName}
              onChange={(e) => setSignName(e.target.value)}
              placeholder={t("lending.form.phSignName")}
            />
          </div>
          <label className="ed-row gap-2 items-start ed-caption">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
            {t("lending.request.agreeBorrower")}
          </label>
        </div>
      )}

      {step === "share" && (
        <div className="ed-stack" style={{ gap: 12 }}>
          <div className="ed-inset-green !p-3">
            <Body className="!text-sm font-semibold" style={{ color: "var(--ed-green)" }}>
              {t("lending.request.codeReady")}
            </Body>
            <Caption className="block mt-1">{t("lending.request.codeHint")}</Caption>
          </div>
          <div
            className="text-center text-2xl font-bold tracking-[0.2em] py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.1)" }}
          >
            {offerCode}
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={copyCode}>
            {copied ? t("lending.request.copied") : t("lending.request.copyCode")}
          </Button>
          <Caption className="block text-center opacity-80">{t("lending.request.packetHint")}</Caption>
          <Button type="button" variant="ghost" className="w-full" onClick={copyPacket}>
            {copiedPacket ? t("lending.request.copied") : t("lending.request.copyPacket")}
          </Button>
          <ToneSurface tone="info">
            <Caption className="block">{t("lending.request.phoneReminder", { phone: requesterPhone })}</Caption>
          </ToneSurface>
        </div>
      )}
    </Modal>
  );
}
