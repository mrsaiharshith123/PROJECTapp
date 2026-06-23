import { useCallback, useEffect, useRef, useState } from "react";
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
      if (ref.current && !ref.current.contains(/** @type {Node} */ (e.target))) {
        setOpen(false);
      }
    };
    // Defer listener so the opening click does not immediately close the menu.
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onDoc, true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onDoc, true);
    };
  }, [open]);

  const toggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  const stableItems = items;

  if (!stableItems.length) return null;

  return (
    <div className="ct-money-overflow" ref={ref}>
      <button
        type="button"
        className="ct-btn ct-btn-ghost ct-btn-sm ct-header-icon-btn"
        aria-label={t("money.overflowMenu")}
        aria-expanded={open}
        aria-haspopup="menu"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
      >
        <CtIcon name="dots-three-vertical" size={22} />
      </button>
      {open ? (
        <div
          className="ct-money-overflow-panel ct-nw-panel !p-1.5"
          role="menu"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {stableItems.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="ct-settings-row ct-money-overflow-item ct-pressable"
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                setOpen(false);
              }}
            >
              <span className="ct-settings-row-label">{item.label}</span>
              <CtIcon name="caret-right" size={14} className="ct-settings-row-caret shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
