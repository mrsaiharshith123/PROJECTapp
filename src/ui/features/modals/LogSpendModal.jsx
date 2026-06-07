import { useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { TRANSACTION_LIFE_CATEGORIES } from "../../../constants/transactionCategories.js";
import { smsTextToDailySpendDraft } from "../../../engines/smsToTransaction.js";
import { todayYmd } from "../../../utils/dates.js";
import { Modal, Stack, Button, Input, FormField, Caption } from "../../index.js";

/** Log interpreted daily spend — opened from existing dashboard tools only. */
export default function LogSpendModal({ onClose }) {
  const { addDailySpend, todayStr, settings } = useCommitTrack();
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [lifeCategory, setLifeCategory] = useState("lifestyle");
  const [date, setDate] = useState(todayStr || todayYmd());
  const [sms, setSms] = useState("");

  const applySms = () => {
    const draft = smsTextToDailySpendDraft(sms);
    if (!draft) return;
    setAmount(String(draft.amount));
    setLabel(draft.label);
    setLifeCategory(draft.lifeCategory || "lifestyle");
    if (draft.date) setDate(draft.date);
  };

  const save = () => {
    const amt = Math.max(0, Number(amount) || 0);
    if (amt <= 0 || !label.trim()) return;
    addDailySpend({
      amount: amt,
      label: label.trim(),
      lifeCategory,
      date,
      profileId: settings.activeProfileId || "default",
      source: sms.trim() ? "sms" : "manual",
    });
    onClose();
  };

  return (
    <Modal
      title={t("tools.logSpend.title")}
      onClose={onClose}
      footer={
        <Stack gap="sm">
          <Button type="button" onClick={save}>
            {t("common.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </Stack>
      }
    >
      <Caption className="block mb-3">{t("tools.logSpend.hint")}</Caption>
      <Stack gap="md">
        <FormField label={t("tools.logSpend.amount")}>
          <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </FormField>
        <FormField label={t("tools.logSpend.label")}>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("tools.logSpend.labelPlaceholder")}
          />
        </FormField>
        <FormField label={t("tools.logSpend.category")}>
          <select className="ct-input w-full" value={lifeCategory} onChange={(e) => setLifeCategory(e.target.value)}>
            {TRANSACTION_LIFE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={t("tools.logSpend.date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label={t("tools.logSpend.smsOptional")}>
          <textarea
            className="ct-input w-full min-h-[72px]"
            value={sms}
            onChange={(e) => setSms(e.target.value)}
            placeholder={t("tools.logSpend.smsPlaceholder")}
          />
        </FormField>
        {sms.trim() && (
          <Button type="button" variant="outline" size="sm" onClick={applySms}>
            {t("tools.logSpend.parseSms")}
          </Button>
        )}
      </Stack>
    </Modal>
  );
}
