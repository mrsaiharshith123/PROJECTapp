export function ProgressBar({ value = 0 }) {
  return (
    <div className="ed-progress-track-track">
      <div
        className="ed-progress-track-fill ed-bar-animated"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
