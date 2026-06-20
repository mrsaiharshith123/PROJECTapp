import { useState } from "react";
import { Modal, Card, Button, Caption, Body, inputClassName } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { smsTextToDailySpendDraft } from "../../../engines/smsToTransaction.js";
import { formatInr } from "../../../constants/symbols.js";
import { getTransactionLifeCategoryMeta } from "../../../constants/transactionCategories.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

const fieldClass = `${inputClassName()} ct-input-tint`;

/** Paste a debit SMS to log variable spend (mirrors bill SMS detect). */
export default function SpendSmsDetectModal({ open, onClose }) {
  const { addDailySpend, settings } = usePerovo();
  const { t } = useTranslation();
  const [sms, setSms] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(null);

  const reset = () => {
    setError("");
    setDraft(null);
  };

  const handleDetect = () => {
    reset();
    const parsed = smsTextToDailySpendDraft(sms);
    if (!parsed) {
      setError(t("bills.detectSmsSpendError"));
      return;
    }
    setDraft(parsed);
  };

  const handleConfirm = () => {
    if (!draft) return;
    addDailySpend({
      amount: draft.amount,
      label: draft.label,
      lifeCategory: draft.lifeCategory || "lifestyle",
      date: draft.date,
      profileId: settings.activeProfileId || "default",
      source: "sms",
    });
    setSms("");
    reset();
    onClose();
  };

  if (!open) return null;

  const life = draft ? getTransactionLifeCategoryMeta(draft.lifeCategory) : null;

  return (
    <Modal onClose={onClose} title={t("bills.detectSmsSpend")}>
      <div className="ct-stack">
        <div className="ct-row gap-3 items-start">
          <span className="ct-icon-tile teal" aria-hidden>
            <CtIcon name="device-mobile" size={22} />
          </span>
          <Caption>{t("bills.detectSmsSpendHint")}</Caption>
        </div>

        <textarea
          className={`${fieldClass} min-h-[100px] w-full`}
          value={sms}
          onChange={(e) => {
            setSms(e.target.value);
            reset();
          }}
          placeholder={t("bills.dailySpend.smsPlaceholder")}
        />
        {error ? <Caption className="block text-[var(--ct-danger)]">{error}</Caption> : null}

        {draft ? (
          <Card variant="flat" className="ct-hero-card wealth ct-stack-sm">
            <div className="ct-hero-glow teal" aria-hidden />
            <p className="ct-hero-label relative">{draft.label}</p>
            <p className="ct-hero-number ct-numeral relative">{formatInr(draft.amount)}</p>
            <Body className="font-semibold relative">
              {t("bills.detectSmsSpendConfirm", {
                amount: formatInr(draft.amount),
                label: draft.label,
                category: life?.label || "—",
                date: draft.date || "—",
              })}
            </Body>
            <div className="ct-row relative">
              <Button type="button" variant="primary" className="flex-1" onClick={handleConfirm}>
                {t("bills.actionLogSpend")}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => { reset(); onClose(); }}>
                {t("common.cancel")}
              </Button>
            </div>
          </Card>
        ) : null}

        <Button type="button" variant="primary" onClick={handleDetect}>
          {t("bills.dailySpend.parseSms")}
        </Button>
      </div>
    </Modal>
  );
}
