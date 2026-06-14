import { CtIcon } from "../icons/CtIcon.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";

/**
 * Family icon with dependent count and optional edit pencil.
 * @param {{ count: number, onEdit?: () => void, iconSize?: number, editLabel?: string }} props
 */
export default function HouseholdFamilyBadge({ count, onEdit, iconSize = 24, editLabel }) {
  const { t } = useTranslation();
  const display = Math.max(0, Number(count) || 0);
  const editAria = editLabel ?? t("household.edit.open");

  return (
    <div className="ct-household-family-badge">
      <span className="ct-household-family-icon" aria-hidden>
        <CtIcon name="users-three" size={iconSize} />
      </span>
      <span
        className="ct-household-dep-count ct-numeral"
        aria-label={t("household.edit.dependentsCountAria", { count: display })}
      >
        {display}
      </span>
      {onEdit ? (
        <button
          type="button"
          className="ct-household-edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={editAria}
        >
          <CtIcon name="note-pencil" size={14} />
        </button>
      ) : null}
    </div>
  );
}
