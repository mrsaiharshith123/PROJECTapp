import { useId, useState } from "react";

export function InfoTip({ text, label = "How this is calculated" }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  if (!text) return null;

  return (
    <span className="inline-flex items-center align-middle ml-1 relative">
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className="ct-info-tip-btn"
        title={label}
      >
        i
      </button>
      {open && (
        <>
          <button type="button" className="ct-info-tip-backdrop" aria-label="Close" onClick={() => setOpen(false)} />
          <span id={id} role="tooltip" className="ct-info-tip-pop">
            {text}
          </span>
        </>
      )}
    </span>
  );
}

export default InfoTip;
