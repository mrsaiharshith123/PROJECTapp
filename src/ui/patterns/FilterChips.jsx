export function FilterChips({ options, value, onChange }) {
  return (
    <div className="ed-row-wrap">
      {options.map((opt) => {
        const id = opt.id ?? opt;
        const label = opt.label ?? opt;
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={active ? "ed-chip active active" : "ed-chip"}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
