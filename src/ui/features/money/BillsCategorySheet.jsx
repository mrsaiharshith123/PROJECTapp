import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal } from "../../primitives/Modal.jsx";
import { FilterChips } from "../../patterns/FilterChips.jsx";
import { Body, Caption } from "../../primitives/Text.jsx";

const CATEGORY_OPTIONS = [
  ["EMI", "category.emi"],
  ["Credit Card", "category.creditCard"],
  ["Subscription", "category.subscription"],
  ["Insurance", "category.insurance"],
  ["SIP", "category.sip"],
  ["Rent", "category.rent"],
  ["Loan", "category.loan"],
  ["Utility", "category.utility"],
  ["Other", "category.other"],
];

/**
 * Collapsed category filter — bottom sheet.
 * @param {{ open: boolean, onClose: () => void, value: string, onChange: (v: string) => void, showHistory: boolean, onToggleHistory: () => void }} props
 */
export default function BillsCategorySheet({
  open,
  onClose,
  value,
  onChange,
  showHistory,
  onToggleHistory,
}) {
  const { t } = useTranslation();

  if (!open) return null;

  const categoryChips = [
    { id: "", label: t("bills.allCategories") },
    ...CATEGORY_OPTIONS.map(([id, key]) => ({ id, label: t(key) })),
  ];

  return (
    <Modal title={t("money.bills.filterCategory")} onClose={onClose} sheet>
      <div className="ct-stack">
        <FilterChips
          options={categoryChips}
          value={value}
          onChange={(id) => {
            onChange(id);
            onClose();
          }}
        />
        <label className="ct-row gap-2 items-center mt-2">
          <input type="checkbox" checked={showHistory} onChange={onToggleHistory} />
          <Body>{t("money.bills.showPaidHistory")}</Body>
        </label>
        <Caption>{t("money.bills.filterCategoryHint")}</Caption>
      </div>
    </Modal>
  );
}
