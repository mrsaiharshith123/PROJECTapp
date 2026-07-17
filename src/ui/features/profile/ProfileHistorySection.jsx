import { useMemo, useState } from "react";
import { Caption, Body, Button } from "../../index.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import CommitmentEditModal from "../modals/CommitmentEditModal.jsx";
import ConfirmDeleteDialog from "../../patterns/ConfirmDeleteDialog.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isHistoryBill } from "../../../utils/billLifecycle.js";
import { recentCommitmentPaymentEvents } from "../../../utils/profileStats.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { SettingsGroup, SettingsGroupContent } from "./SettingsGroup.jsx";

function formatDate(dateStr, locale) {
  if (!dateStr) return "—";
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(locale === "en" ? "en-IN" : locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProfileHistorySection({
  commitments,
  getEffectiveStatus,
  todayStr,
  deleteCommitment,
  removeCommitmentPayment,
  updateCommitment,
}) {
  const { t, locale } = useTranslation();
  const [editing, setEditing] = useState(null);
  const [confirmDeleteFor, setConfirmDeleteFor] = useState(null);
  const [showPayments, setShowPayments] = useState(true);
  const [showBills, setShowBills] = useState(true);

  const payments = useMemo(() => recentCommitmentPaymentEvents(commitments, 50), [commitments]);
  const endedBills = useMemo(
    () =>
      commitments
        .filter((c) => isHistoryBill(c, getEffectiveStatus, todayStr))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    [commitments, getEffectiveStatus, todayStr],
  );

  return (
    <>
      <SettingsGroup title={t("profile.history")} icon="arrows-clockwise" description={t("profile.sectionHistoryHint")}>
        <SettingsGroupContent className="ed-stack-sm">
          <button
            type="button"
            onClick={() => setShowPayments((v) => !v)}
            className="ed-settings-row ed-settings-row-static"
          >
            <span className="ed-icon-tile ed-icon-tile-sm teal">
              <CtIcon name="receipt" size={18} weight="duotone" />
            </span>
            <span className="ed-settings-row-label flex-1">
              {t("profile.history.recordedPayments", { count: payments.length })}
            </span>
            <CtIcon name={showPayments ? "eye" : "eye-slash"} size={14} className="ed-settings-chevron" />
          </button>

          {showPayments && (
            <ul className="ed-stack-sm">
              {payments.length === 0 && <Caption>{t("profile.history.noPayments")}</Caption>}
              {payments.map((row) => (
                <li key={row.id} className="ed-inset ed-row-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Body className="font-semibold truncate !text-sm">{row.name}</Body>
                    <Caption>{formatDate(row.date, locale)}</Caption>
                  </div>
                  <span className="text-sm font-semibold shrink-0">₹{Number(row.amount).toLocaleString("en-IN")}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="!w-auto shrink-0"
                    onClick={() => removeCommitmentPayment(row.commitmentId, row.paymentIndex)}
                  >
                    {t("profile.history.removePayment")}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowBills((v) => !v)}
            className="ed-settings-row ed-settings-row-static"
          >
            <span className="ed-icon-tile ed-icon-tile-sm violet">
              <CtIcon name="package" size={18} weight="duotone" />
            </span>
            <span className="ed-settings-row-label flex-1">
              {t("profile.history.endedBills", { bills: t("nav.bills"), count: endedBills.length })}
            </span>
            <CtIcon name={showBills ? "eye" : "eye-slash"} size={14} className="ed-settings-chevron" />
          </button>

          {showBills && (
            <ul className="ed-stack-sm">
              {endedBills.length === 0 && <Caption>{t("profile.history.noEndedBills")}</Caption>}
              {endedBills.map((bill) => (
                <li key={bill.id} className="ed-inset ed-stack-sm">
                  <Body className="font-semibold truncate !text-sm">{getBillDisplayName(bill)}</Body>
                  <Caption>
                    {t("profile.history.paymentRecords", { count: (bill.payments || []).length })}
                    {bill.endDate ? t("profile.history.endedOn", { date: formatDate(bill.endDate, locale) }) : ""}
                  </Caption>
                  <div className="ed-row gap-2">
                    <Button type="button" variant="outline" size="sm" className="!w-auto" onClick={() => setEditing(bill)}>
                      {t("common.edit")}
                    </Button>
                    <Button type="button" variant="danger" size="sm" className="!w-auto" onClick={() => setConfirmDeleteFor(bill)}>
                      {t("common.delete")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SettingsGroupContent>
      </SettingsGroup>

      {editing && (
        <CommitmentEditModal
          key={editing.id}
          commitment={editing}
          onClose={() => setEditing(null)}
          onSave={(id, patch) => {
            updateCommitment(id, patch);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={!!confirmDeleteFor}
        title={t("confirmDelete.bill.title")}
        message={confirmDeleteFor ? t("confirmDelete.bill.message", { name: getBillDisplayName(confirmDeleteFor) }) : ""}
        onCancel={() => setConfirmDeleteFor(null)}
        onConfirm={() => {
          deleteCommitment(confirmDeleteFor.id);
          setConfirmDeleteFor(null);
        }}
      />
    </>
  );
}
