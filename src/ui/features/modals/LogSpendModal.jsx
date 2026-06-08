import { useMemo, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";
import { TRANSACTION_LIFE_CATEGORIES, getTransactionLifeCategoryMeta } from "../../../constants/transactionCategories.js";
import { smsTextToDailySpendDraft } from "../../../engines/smsToTransaction.js";
import { classifyMerchant } from "../../../utils/merchantNormalize.js";
import { todayYmd } from "../../../utils/dates.js";
import { Modal, Stack, Button, Input, FormField, Caption, CtIcon } from "../../index.js";

const LIFE_CATEGORY_ICON = {
  survival: "shield",
  lifestyle: "fork-knife",
  growth: "chart-line-up",
  pressure: "hourglass",
  risk: "warning",
};

/** Quick-add daily spend — primary entry on Bills → Daily spend. */
export default function LogSpendModal({ onClose }) {
  const { addDailySpend, todayStr, settings } = useCommitTrack();
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");
  const [lifeCategory, setLifeCategory] = useState("lifestyle");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [date, setDate] = useState(todayStr || todayYmd());
  const [sms, setSms] = useState("");

  const merchantPreview = useMemo(() => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    return classifyMerchant(trimmed);
  }, [label]);

  const onLabelChange = (value) => {
    setLabel(value);
    if (!categoryTouched && value.trim()) {
      const m = classifyMerchant(value.trim());
      setLifeCategory(m.lifeCategory);
    }
  };

  const applySms = () => {
    const draft = smsTextToDailySpendDraft(sms);
    if (!draft) return;
    setAmount(String(draft.amount));
    setLabel(draft.label);
    setLifeCategory(draft.lifeCategory || "lifestyle");
    setCategoryTouched(false);
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

  const lifeMeta = getTransactionLifeCategoryMeta(lifeCategory);

  return (
    <Modal
      title={t("bills.actionLogSpend")}
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
      <Caption className="block mb-3">{t("bills.dailySpend.formHint")}</Caption>
      <Stack gap="md">
        <FormField label={t("bills.dailySpend.amount")}>
          <Input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="ct-numeral"
            autoFocus
          />
        </FormField>
        <FormField label={t("bills.dailySpend.label")}>
          <Input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            placeholder={t("bills.dailySpend.labelPlaceholder")}
          />
          {merchantPreview && label.trim() && (
            <Caption className="block mt-1.5 text-[var(--ct-accent-muted)]">
              {t("bills.dailySpend.detectedAs", {
                merchant: merchantPreview.label,
                category: getTransactionLifeCategoryMeta(merchantPreview.lifeCategory).label,
              })}
            </Caption>
          )}
        </FormField>
        <FormField label={t("bills.dailySpend.category")}>
          <div className="ct-row-wrap">
            {TRANSACTION_LIFE_CATEGORIES.map((c) => {
              const active = lifeCategory === c.id;
              const icon = LIFE_CATEGORY_ICON[c.id] || "warning";
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`ct-chip${active ? " ct-chip-active" : ""}`}
                  onClick={() => {
                    setLifeCategory(c.id);
                    setCategoryTouched(true);
                  }}
                >
                  <CtIcon name={icon} size={14} context="category" />
                  {c.label}
                </button>
              );
            })}
          </div>
          <Caption className="block mt-1.5">{t("bills.dailySpend.selectedCategory", { category: lifeMeta.label })}</Caption>
        </FormField>
        <FormField label={t("bills.dailySpend.date")}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormField>
        <FormField label={t("bills.dailySpend.smsOptional")}>
          <textarea
            className="ct-input w-full min-h-[72px]"
            value={sms}
            onChange={(e) => setSms(e.target.value)}
            placeholder={t("bills.dailySpend.smsPlaceholder")}
          />
        </FormField>
        {sms.trim() && (
          <Button type="button" variant="outline" size="sm" onClick={applySms}>
            {t("bills.dailySpend.parseSms")}
          </Button>
        )}
      </Stack>
    </Modal>
  );
}
