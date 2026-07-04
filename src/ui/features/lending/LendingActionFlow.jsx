import { useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
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
import { CtIcon } from "../../icons/CtIcon.jsx";

/**
 * @param {{ lending: object, settings: object, onScrollToEsign?: () => void }} props
 */
export default function LendingActionFlow({ lending, settings, onScrollToEsign }) {
  const { t } = useTranslation();
  const { updateLending } = usePerovo();
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
      <div className="ed-next-action ed-next-action-danger">
        <div className="flex items-start gap-2">
          <span style={{ color: "var(--ed-red)", flexShrink: 0 }} aria-hidden>
            <CtIcon name="warning" size={18} context="status" />
          </span>
          <div>
            <Body className="!text-sm font-semibold">{t("lending.detail.nextAction")}</Body>
            <Body className="!text-sm mt-1">{t("lending.flow.overdueTitle", { days: overdueDays })}</Body>
          </div>
        </div>
        <div className="ed-stack-sm mt-3">
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
            <Button type="button" size="sm" className="ed-btn-escalation" onClick={() => openWhatsApp(3)}>
              {t("lending.flow.reminderFinal")}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="ed-next-action ed-next-action-success">
        <Body className="!text-sm font-semibold">{t("lending.detail.nextAction")}</Body>
        <Body className="!text-sm mt-1">{t("lending.flow.confirmed")}</Body>
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
      </div>
    );
  }

  return (
    <>
      <div className="ed-next-action">
        <Body className="!text-sm font-semibold">{t("lending.detail.nextAction")}</Body>
        <Body className="!text-sm mt-1">{t("lending.flow.readyToShare")}</Body>
        <div className="ed-row-wrap gap-2 mt-2">
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
      </div>
      <LegalDetailsModal lending={lending} open={legalOpen} onClose={() => setLegalOpen(false)} />
    </>
  );
}
