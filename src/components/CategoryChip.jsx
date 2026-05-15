import { getCategoryById } from "../constants/categories.js";

export default function CategoryChip({ categoryId, className = "" }) {
  const c = getCategoryById(categoryId);
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${c.chipClass} ${className}`}
    >
      <span aria-hidden>{c.icon}</span>
      {c.label}
    </span>
  );
}
