import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/**
 * Header overflow (⋯) for export / secondary actions on Money views.
 * @param {{ items: { id: string, label: string, onClick: () => void }[] }} props
 */
export default function MoneyOverflowMenu({ items }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  if (!items.length) return null;

  return (
    <div className="ct-money-overflow" ref={ref}>
      <button
        type="button"
        className="ct-btn ct-btn-ghost ct-btn-sm ct-header-icon-btn"
        aria-label={t("money.overflowMenu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CtIcon name="dots-three-vertical" size={22} />
      </button>
      {open ? (
        <div className="ct-money-overflow-panel" role="menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="ct-money-overflow-item"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
