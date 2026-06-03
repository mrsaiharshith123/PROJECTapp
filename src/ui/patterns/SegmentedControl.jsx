export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="ct-segmented">
      {options.map((opt) => {
        const id = typeof opt === "string" ? opt : opt.id;
        const label = typeof opt === "string" ? opt : opt.label;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={value === id ? "ct-segmented-tab ct-segmented-tab-active" : "ct-segmented-tab"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
