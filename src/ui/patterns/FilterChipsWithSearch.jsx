import { useEffect, useRef, useState } from "react";
import { FilterChips } from "./FilterChips.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";
import { inputClassName } from "../primitives/Input.jsx";

/**
 * Horizontal filter chips with a magnifying-glass toggle that reveals search.
 * @param {{
 *   options: { id: string, label: string }[],
 *   value: string,
 *   onChange: (id: string) => void,
 *   search: string,
 *   onSearchChange: (q: string) => void,
 *   searchPlaceholder: string,
 *   searchAriaLabel?: string,
 * }} props
 */
export function FilterChipsWithSearch({
  options,
  value,
  onChange,
  search,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const showInput = open || Boolean(search);

  useEffect(() => {
    if (showInput) inputRef.current?.focus();
  }, [showInput]);

  const toggle = () => {
    if (showInput && !search) {
      setOpen(false);
      onSearchChange("");
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <div className="ed-stack-sm">
      <div className="ed-row-wrap">
        <FilterChips options={options} value={value} onChange={onChange} />
        <button
          type="button"
          className={`ed-chip ed-chip ${showInput ? "active" : ""}`}
          onClick={toggle}
          aria-label={searchAriaLabel || searchPlaceholder}
          aria-expanded={showInput}
        >
          <CtIcon name="magnifying-glass" size={16} />
        </button>
      </div>
      {showInput && (
        <div className="ed-search-field ed-search-field">
          <CtIcon name="magnifying-glass" size={16} className="ed-search-icon" />
          <input
            ref={inputRef}
            type="search"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={inputClassName("ed-input")}
            aria-label={searchAriaLabel || searchPlaceholder}
          />
        </div>
      )}
    </div>
  );
}
