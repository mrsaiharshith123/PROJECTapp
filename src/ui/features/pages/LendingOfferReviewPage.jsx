import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, Button, Caption, Body, Eyebrow, ToneSurface, inputClassName } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { decodeOfferPayload, trustScoreLabel } from "../../../engines/lendingAgreement.js";
import { LEGAL_DISCLAIMER } from "../../../constants/plainLanguage.js";
import { formatInr } from "../../../constants/symbols.js";
import { trustScoreToTone } from "../../../engines/lendingTrust.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { buildLendingRecord } from "../../../utils/lendingRecord.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

export default function LendingOfferReview() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { addLending, settings } = usePerovo();
  const [lenderName, setLenderName] = useState(settings.displayName || "");
  const [signName, setSignName] = useState("");
  const [agree, setAgree] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const offer = useMemo(() => decodeOfferPayload(params.get("d")), [params]);

  if (!offer) {
    return (
      <div className="ct-page ct-stack max-w-lg mx-auto min-h-screen justify-center">
        <Card className="ct-stack-sm text-center py-10">
          <span className="ct-icon-tile danger mx-auto" aria-hidden>
            <CtIcon name="warning" size={24} context="status" />
          </span>
          <Body className="font-semibold">{t("lending.offer.invalidTitle")}</Body>
          <Caption className="block">{t("lending.offer.invalidLink")}</Caption>
          <Link to="/" className="ct-link text-sm font-semibold mt-2 inline-block">
            {t("lending.offer.goHome")}
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
      }),
    );
    setAccepted(true);
  };

  if (accepted) {
    return (
      <div className="ct-page ct-stack max-w-lg mx-auto min-h-screen justify-center">
        <Card className="ct-stack-sm text-center py-8">
          <span className="ct-icon-tile teal mx-auto" aria-hidden>
            <CtIcon name="check" size={28} context="status" />
          </span>
          <Body className="font-semibold ct-text-success">{t("lending.offer.acceptedTitle")}</Body>
          <Caption className="block">
            {t("lending.offer.acceptedBody", { name: offer.borrowerName })}
          </Caption>
          <Link to="/money/lending" className="ct-link text-sm font-semibold mt-4 inline-block">
            {t("lending.offer.openTracker")}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="ct-page ct-stack max-w-lg mx-auto pb-10">
      <div className="ct-hero-card lending relative">
        <div className="ct-hero-glow" aria-hidden />
        <Eyebrow>{t("lending.offer.eyebrow")}</Eyebrow>
        <p className="ct-hero-label mt-2">{t("lending.offer.headline", { name: offer.borrowerName })}</p>
        <p className="ct-hero-number">{formatInr(offer.amount)}</p>
      </div>

      <Card className="ct-stack-sm">
        <Caption className="block font-semibold uppercase tracking-wide">{t("lending.offer.trustTitle")}</Caption>
        <span className={`inline-flex text-sm font-bold px-3 py-1 rounded-full border ${semanticToneToClass(trustScoreToTone(score))}`}>
          {score}/100 · {label}
        </span>
        <Caption className="block">{offer.trustSummary}</Caption>
        {(offer.trustOnTime > 0 || offer.trustLate > 0) && (
          <Caption className="block opacity-80">
            {t("lending.offer.onTimeLate", { onTime: offer.trustOnTime, late: offer.trustLate })}
          </Caption>
        )}
      </Card>

      <div className="ct-grid-2">
        <div className="ct-stat-tile indigo">
          <p className="ct-stat-tile-label">{t("lending.offer.interest")}</p>
          <p className="ct-stat-tile-value ct-numeral mt-1">
            {t("lending.offer.interestPerYear", { rate: offer.interestRate || 0 })}
          </p>
        </div>
        <div className="ct-stat-tile teal">
          <p className="ct-stat-tile-label">{t("lending.offer.payBackBy")}</p>
          <p className="ct-stat-tile-value mt-1">{offer.dueDate}</p>
        </div>
      </div>

      {(offer.purpose || offer.collateral) && (
        <Card className="ct-stack-sm">
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

      <Card className="ct-stack-sm">
        <Body className="text-xs font-semibold">{t("lending.offer.agreement")}</Body>
        <pre className="ct-inset text-[11px] whitespace-pre-wrap max-h-40 overflow-y-auto !p-3">{offer.agreementText}</pre>
      </Card>

      <Card className="ct-stack">
        <ToneSurface tone="warning">
          <Caption className="block">{LEGAL_DISCLAIMER}</Caption>
        </ToneSurface>
        <div>
          <label className="ct-field-label">{t("lending.offer.lenderName")}</label>
          <input className={fieldClass} value={lenderName} onChange={(e) => setLenderName(e.target.value)} />
        </div>
        <div>
          <label className="ct-field-label">{t("lending.offer.signAccept")}</label>
          <input className={fieldClass} value={signName} onChange={(e) => setSignName(e.target.value)} />
        </div>
        <label className="ct-row gap-2 items-start ct-caption">
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
