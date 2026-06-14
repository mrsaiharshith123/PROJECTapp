import { useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { isInDefault, daysSinceOldestOverdue, generateDefaultNoticeHtml } from "../../../engines/lendingRecovery.js";
import {
  buildAgreementShareMessage,
  buildDealConfirmedMessage,
  buildEscalationMessage,
  buildWhatsAppLink,
} from "../../../utils/lendingWhatsApp.js";
import LegalDetailsModal from "../modals/LegalDetailsModal.jsx";
import { Button, Body, ToneSurface } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/**
 * @param {{ lending: object, settings: object, onScrollToEsign?: () => void }} props
 */
export default function LendingActionFlow({ lending, settings, onScrollToEsign }) {
  const { t } = useTranslation();
  const { updateLending } = useCommitTrack();
  const [legalOpen, setLegalOpen] = useState(false);

  const confirmed = lending.esignStatus === "completed" || lending.lenderOtpVerifiedAt || lending.lenderConfirmedAt;
  const detailsComplete = Boolean(lending.borrowerFullName?.trim());
  const overdue = isInDefault(lending);
  const overdueDays = daysSinceOldestOverdue(lending);
  const lastLevel = Number(lending.lastReminderLevel) || 0;

  const openWhatsApp = (level) => {
    const msg = buildEscalationMessage(lending, settings, level);
    const url = buildWhatsAppLink(lending.borrowerPhone, msg);
    updateLending(lending.id, { lastReminderLevel: Math.max(lastLevel, level) });
    window.open(url, "_blank", "noopener,noreferrer");
    if (level === 3) {
      const html = generateDefaultNoticeHtml(lending, settings);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const u = URL.createObjectURL(blob);
      window.open(u, "_blank", "noopener,noreferrer");
    }
  };

  if (!detailsComplete) {
    return (
      <>
        <ToneSurface tone="warning">
          <Body className="!text-sm">{t("lending.flow.detailsIncomplete")}</Body>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setLegalOpen(true)}>
            {t("lending.flow.completeDetails")}
          </Button>
        </ToneSurface>
        <LegalDetailsModal lending={lending} open={legalOpen} onClose={() => setLegalOpen(false)} />
      </>
    );
  }

  if (overdue) {
    return (
      <div className="ct-stack-sm">
        <ToneSurface tone="danger">
          <Body className="!text-sm">{t("lending.flow.overdueTitle", { days: overdueDays })}</Body>
        </ToneSurface>
        {overdueDays <= 30 && lastLevel < 1 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => openWhatsApp(1)}>
            {t("lending.flow.reminderFriendly")}
          </Button>
        ) : null}
        {overdueDays >= 8 && overdueDays <= 30 && lastLevel < 2 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => openWhatsApp(2)}>
            {t("lending.flow.reminderFirm")}
          </Button>
        ) : null}
        {overdueDays > 30 ? (
          <Button type="button" variant="primary" size="sm" onClick={() => openWhatsApp(3)}>
            {t("lending.flow.reminderFinal")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (confirmed) {
    return (
      <ToneSurface tone="success">
        <Body className="!text-sm">{t("lending.flow.confirmed")}</Body>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            window.open(
              buildWhatsAppLink(lending.borrowerPhone, buildDealConfirmedMessage(lending, settings)),
              "_blank",
            )
          }
        >
          {t("lending.flow.dealWhatsapp")}
        </Button>
      </ToneSurface>
    );
  }

  return (
    <>
      <ToneSurface tone="info">
        <Body className="!text-sm">{t("lending.flow.readyToShare")}</Body>
        <div className="ct-row-wrap gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                buildWhatsAppLink(lending.borrowerPhone, buildAgreementShareMessage(lending, settings)),
                "_blank",
              )
            }
          >
            {t("lending.flow.shareWhatsapp")}
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={() => onScrollToEsign?.()}>
            {t("lending.flow.startEsign")}
          </Button>
        </div>
      </ToneSurface>
      <LegalDetailsModal lending={lending} open={legalOpen} onClose={() => setLegalOpen(false)} />
    </>
  );
}
