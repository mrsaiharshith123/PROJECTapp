export function ProgressBar({ value = 0 }) {
  return (
    <div className="ct-progress-track">
      <div
        className="ct-progress-fill ct-bar-animated"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
