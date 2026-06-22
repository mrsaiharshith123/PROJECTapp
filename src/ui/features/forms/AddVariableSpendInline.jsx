import { useMemo, useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { TRANSACTION_LIFE_CATEGORIES, getTransactionLifeCategoryMeta } from "../../../constants/transactionCategories.js";
import { smsTextToDailySpendDraft } from "../../../engines/smsToTransaction.js";
import { classifyMerchant } from "../../../utils/merchantNormalize.js";
import { todayYmd } from "../../../utils/dates.js";
import { Button, inputClassName, Caption, CtIcon } from "../../index.js";
import { canAddDailySpend } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";

const LIFE_CATEGORY_ICON = {
  survival: "shield",
  lifestyle: "fork-knife",
  growth: "chart-line-up",
  pressure: "hourglass",
  risk: "warning",
};

const fieldClass = `${inputClassName()} ct-input-tint`;

/** Inline variable spend on Add page — same data path as Bills → Variable spend. */
export default function AddVariableSpendInline({ onSaved }) {
  const { addDailySpend, allDailySpends, todayStr, settings } = usePerovo();
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

  const spendGate = canAddDailySpend(settings, allDailySpends, todayStr || date);

  const save = () => {
    const amt = Math.max(0, Number(amount) || 0);
    if (amt <= 0 || !label.trim() || !spendGate.ok) return;
    addDailySpend({
      amount: amt,
      label: label.trim(),
      lifeCategory,
      date,
      profileId: settings.activeProfileId || "default",
      source: sms.trim() ? "sms" : "manual",
    });
    onSaved?.();
  };

  const lifeMeta = getTransactionLifeCategoryMeta(lifeCategory);

  return (
    <div className="ct-stack-lg">
      <div className="ct-stat-tile teal">
        <Caption className="block">{t("add.variableIntro")}</Caption>
      </div>
      {!spendGate.ok && (
        <TierLimitBanner
          compact
          title={t("tier.limit.spendTitle")}
          message={t("tier.limit.spendMessage", { limit: spendGate.limit })}
        />
      )}

      <div>
        <label className="ct-field-label">{t("bills.dailySpend.amount")}</label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${fieldClass} ct-numeral`}
          autoFocus
        />
      </div>

      <div>
        <label className="ct-field-label">{t("bills.dailySpend.label")}</label>
        <input
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          placeholder={t("bills.dailySpend.labelPlaceholder")}
          className={fieldClass}
        />
        {merchantPreview && label.trim() && (
          <Caption className="block mt-1.5 text-[var(--ct-accent-muted)]">
            {t("bills.dailySpend.detectedAs", {
              merchant: merchantPreview.label,
              category: getTransactionLifeCategoryMeta(merchantPreview.lifeCategory).label,
            })}
          </Caption>
        )}
      </div>

      <div>
        <label className="ct-field-label">{t("bills.dailySpend.category")}</label>
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
      </div>

      <div>
        <label className="ct-field-label">{t("bills.dailySpend.date")}</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
      </div>

      <div>
        <label className="ct-field-label">{t("bills.dailySpend.smsOptional")}</label>
        <textarea
          className={`${fieldClass} w-full min-h-[72px]`}
          value={sms}
          onChange={(e) => setSms(e.target.value)}
          placeholder={t("bills.dailySpend.smsPlaceholder")}
        />
        {sms.trim() && (
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={applySms}>
            {t("bills.dailySpend.parseSms")}
          </Button>
        )}
      </div>

      <Button type="button" onClick={save} size="lg" disabled={!spendGate.ok}>
        {t("add.variableSave")}
      </Button>
    </div>
  );
}
