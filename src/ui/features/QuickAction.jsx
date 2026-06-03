export function QuickAction({ icon, label, onClick }) {
  return (
    <button type="button" onClick={onClick} className="ct-quick-action">
      <span className="ct-quick-action-icon">{icon}</span>
      <span className="ct-quick-action-label">{label}</span>
    </button>
  );
}

export function QuickActionRow({ children }) {
  return <div className="ct-quick-row">{children}</div>;
}
