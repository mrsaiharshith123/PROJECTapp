export function FilterChips({ options, value, onChange }) {
  return (
    <div className="ct-filter-chips-row">
      {options.map((opt) => {
        const id = opt.id ?? opt;
        const label = opt.label ?? opt;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={active ? "ct-chip ct-chip-active ct-chip-filter-active" : "ct-chip"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
