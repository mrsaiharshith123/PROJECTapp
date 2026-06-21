import { useTranslation } from "../../i18n/I18nProvider.js";
import { translateCategory } from "../../i18n/domainLabels.js";
import { categoryChipClass } from "../tokens/categoryChips.js";
import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { getCategoryById } from "../../constants/categories.js";

export function CategoryChip({ categoryId, className = "" }) {
  const { t } = useTranslation();
  const c = getCategoryById(categoryId);
  return (
    <span className={cn("ct-chip", categoryChipClass(categoryId), className)}>
      <span aria-hidden className="ct-chip-icon">
        <CtIcon name={c.icon} size={14} context="category" />
      </span>
      {translateCategory(t, categoryId)}
    </span>
  );
}

export default CategoryChip;
