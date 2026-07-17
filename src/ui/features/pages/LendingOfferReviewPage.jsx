import { useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, Button, Caption, Body, Eyebrow, ToneSurface, inputClassName } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { decodeOfferPayload } from "../../../engines/lendingAgreement.js";
import { loadLendingOffer } from "../../../services/lending/offerRegistry.js";
import { LEGAL_DISCLAIMER } from "../../../constants/plainLanguage.js";
import { formatInr } from "../../../constants/symbols.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { phoneNumbersMatch } from "../../../utils/sanitize.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const fieldClass = `${inputClassName()} `;

export default function LendingOfferReview() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { addLending, settings } = usePerovo();
  const [lenderName, setLenderName] = useState(settings.displayName || "");
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const codeParam = params.get("code");
  const payloadParam = params.get("d");
  const offer =
    (codeParam ? loadLendingOffer(codeParam) : null) ?? decodeOfferPayload(payloadParam);
  const needsPhoneVerify = Boolean(offer?.requesterPhone) && !phoneVerified;

  const verifyPhone = () => {
    if (phoneNumbersMatch(phoneInput, offer.requesterPhone)) {
      setPhoneVerified(true);
      setPhoneError("");
    } else {
      setPhoneError(t("lending.offer.verifyPhoneError"));
    }
  };

  const acceptLoan = useCallback(() => {
    if (!offer || !signName.trim() || !agree) return;
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
      }),
    );
    setAccepted(true);
  }, [addLending, agree, offer, signName]);

  if (!offer) {
    return (
      <div
        className="ed-page ed-stack max-w-lg mx-auto min-h-screen justify-center"
        style={{ background: "var(--ed-bg)" }}
      >
        <Card className="ed-stack-sm text-center py-10">
          <span
            className="ed-icon-tile mx-auto"
            style={{ color: "var(--ed-red)", background: "var(--ed-red-soft)" }}
            aria-hidden
          >
            <CtIcon name="warning" size={24} context="status" />
          </span>
          <Body className="font-semibold">{t("lending.offer.invalidTitle")}</Body>
          <Caption className="block">{t("lending.offer.invalidCode")}</Caption>
          <Link to="/" className="ed-link text-sm font-semibold mt-2 inline-block">
            {t("lending.offer.goHome")}
          </Link>
        </Card>
      </div>
    );
  }

  if (needsPhoneVerify) {
    return (
      <div
        className="ed-page ed-stack max-w-lg mx-auto min-h-screen justify-center"
        style={{ background: "var(--ed-bg)" }}
      >
        <Card className="ed-stack-sm text-center py-8">
          <span
            className="ed-icon-tile mx-auto"
            style={{ color: "var(--ed-indigo)", background: "var(--ed-indigo-soft)" }}
            aria-hidden
          >
            <CtIcon name="shield" size={24} context="status" />
          </span>
          <Body className="font-semibold">{t("lending.offer.verifyPhoneTitle")}</Body>
          <Caption className="block">
            {t("lending.offer.verifyPhoneHint", { name: offer.borrowerName })}
          </Caption>
          <input
            type="tel"
            className={`${fieldClass} text-center`}
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value);
              setPhoneError("");
            }}
            placeholder={t("lending.offer.verifyPhonePlaceholder")}
          />
          {phoneError ? <Caption className="block" style={{ color: "var(--ed-red)" }}>{phoneError}</Caption> : null}
          <Button type="button" variant="primary" className="w-full" disabled={!phoneInput.trim()} onClick={verifyPhone}>
            {t("lending.offer.verifyPhoneCta")}
          </Button>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div
        className="ed-page ed-stack max-w-lg mx-auto min-h-screen justify-center"
        style={{ background: "var(--ed-bg)" }}
      >
        <Card className="ed-stack-sm text-center py-8">
          <span
            className="ed-icon-tile mx-auto"
            style={{ color: "var(--ed-green)", background: "var(--ed-green-soft)" }}
            aria-hidden
          >
            <CtIcon name="check" size={28} context="status" />
          </span>
          <Body className="font-semibold ed-success-text">{t("lending.offer.acceptedTitle")}</Body>
          <Caption className="block">
            {t("lending.offer.acceptedBody", { name: offer.borrowerName })}
          </Caption>
          <Link to="/agreements" className="ed-link text-sm font-semibold mt-4 inline-block">
            {t("lending.offer.openTracker")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="ed-page ed-stack max-w-lg mx-auto pb-10" style={{ background: "var(--ed-bg)" }}>
      <div className="ed-inset relative">
<Eyebrow>{t("lending.offer.eyebrow")}</Eyebrow>
        <p className="ed-kicker mt-2">{t("lending.offer.headline", { name: offer.borrowerName })}</p>
        <p className="ed-hero-number">{formatInr(offer.amount)}</p>
      </div>

      <div className="ed-grid-2">
        <div className="ed-inset">
          <p className="ed-stat-label">{t("lending.offer.interest")}</p>
          <p className="ed-stat-value ed-numeral mt-1">
            {t("lending.offer.interestPerYear", { rate: offer.interestRate || 0 })}
          </p>
        </div>
        <div className="ed-inset-green">
          <p className="ed-stat-label">{t("lending.offer.payBackBy")}</p>
          <p className="ed-stat-value mt-1">{offer.dueDate}</p>
        </div>
      </div>

      {(offer.purpose || offer.collateral) && (
        <Card className="ed-stack-sm">
          {offer.purpose ? (
            <Caption className="block">
              <span className="font-semibold">{t("lending.offer.for")}</span> {offer.purpose}
            </Caption>
          ) : null}
          {offer.collateral ? (
            <Caption className="block">
              <span className="font-semibold">{t("lending.offer.collateral")}</span> {offer.collateral}
            </Caption>
          ) : null}
          <Caption className="block opacity-80">
            {t("lending.offer.borrowerSigned", {
              name: offer.borrowerSignName,
              date: new Date(offer.borrowerSignedAt).toLocaleString("en-IN", { dateStyle: "medium" }),
            })}
          </Caption>
        </Card>
      )}

      <Card className="ed-stack-sm">
        <Body className="text-xs font-semibold">{t("lending.offer.agreement")}</Body>
        <pre className="ed-inset text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto !p-3">{offer.agreementText}</pre>
      </Card>

      <Card className="ed-stack">
        <ToneSurface tone="warning">
          <Caption className="block">{LEGAL_DISCLAIMER}</Caption>
        </ToneSurface>
        <div>
          <label className="ed-field-label">{t("lending.offer.lenderName")}</label>
          <input className={fieldClass} value={lenderName} onChange={(e) => setLenderName(e.target.value)} />
        </div>
        <div>
          <label className="ed-field-label">{t("lending.offer.signAccept")}</label>
          <input className={fieldClass} value={signName} onChange={(e) => setSignName(e.target.value)} />
        </div>
        <label className="ed-caption flex items-start gap-2">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5" />
          {t("lending.offer.agreeLender")}
        </label>
        <Button type="button" variant="primary" className="w-full" disabled={!signName.trim() || !agree} onClick={acceptLoan}>
          {t("lending.offer.acceptCta")}
        </Button>
      </Card>
    </div>
  );
}
