import { useId, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";

/**
 * @param {{ text?: string, textKey?: string, label?: string, labelKey?: string }} props
 */
export function InfoTip({ text, textKey, label, labelKey = "help.infoLabel" }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();

  const content = textKey ? t(textKey) : text?.startsWith("help.") ? t(text) : text;
  const tipLabel = labelKey ? t(labelKey) : label || t("help.infoLabel");

  if (!content) return null;

  return (
    <span className="inline-flex items-center align-middle ml-1 relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className="ed-info-tip-btn"
        title={tipLabel}
      >
        i
      </button>
      {open && (
        <>
          <button
            type="button"
            className="ed-modal-backdrop"
            aria-label={t("common.close")}
            onClick={() => setOpen(false)}
          />
          <span id={id} role="tooltip" className="ed-inset">
            {content}
          </span>
        </>
      )}
    </span>
  );
}

export default InfoTip;
