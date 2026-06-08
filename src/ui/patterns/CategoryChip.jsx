import { getCategoryById } from "../../constants/categories.js";
import { categoryChipClass } from "../tokens/categoryChips.js";
import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";

export function CategoryChip({ categoryId, className = "" }) {
  const c = getCategoryById(categoryId);
  return (
    <span className={cn(categoryChipClass(categoryId), className)}>
      <span aria-hidden className="inline-flex">
        <CtIcon name={c.icon} size={14} context="category" />
      </span>
      {c.label}
    </span>
  );
}

export default CategoryChip;
