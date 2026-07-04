export function SegmentedControl({ options, value, onChange, className = "" }) {
  return (
    <div className={`ed-segmented${className ? ` ${className}` : ""}`}>
      {options.map((opt) => {
        const id = typeof opt === "string" ? opt : opt.id;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`ed-segmented-tab${value === id ? " active" : ""}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
