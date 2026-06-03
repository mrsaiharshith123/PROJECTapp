import { getCategoryById } from "../../constants/categories.js";
import { categoryChipClass } from "../tokens/categoryChips.js";
import { cn } from "../utils/cn.js";

export function CategoryChip({ categoryId, className = "" }) {
  const c = getCategoryById(categoryId);
  return (
    <span className={cn(categoryChipClass(categoryId), className)}>
      <span aria-hidden>{c.icon}</span>
      {c.label}
    </span>
  );
}

export default CategoryChip;
