/**
 * Inline “View X →” navigation hint inside cards.
 * @param {{ label: string, onClick: () => void, className?: string }} props
 */
export function ViewLink({ label, onClick, className = "" }) {
  return (
    <button type="button" className={`pos-view-link ${className}`.trim()} onClick={onClick}>
      {label} <span aria-hidden>→</span>
    </button>
  );
}

export default ViewLink;
