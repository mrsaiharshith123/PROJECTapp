import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { INDIAN_CITIES, DEFAULT_CITY_ID } from "../../constants/cityLivingCosts.js";
import { inputClassName } from "../primitives/Input.jsx";

/**
 * Searchable city picker — grouped by state.
 * @param {{ value?: string, onChange: (cityId: string) => void, className?: string, required?: boolean }} props
 */
export function CitySelect({ value = "", onChange, className = "", required = false }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const fieldClass = className || inputClassName();

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? INDIAN_CITIES.filter(
          (c) => c.label.toLowerCase().includes(q) || c.state?.toLowerCase().includes(q) || c.id.includes(q),
        )
      : INDIAN_CITIES;
    /** @type {Map<string, typeof INDIAN_CITIES>} */
    const map = new Map();
    for (const city of filtered) {
      const state = city.state || "Other";
      if (!map.has(state)) map.set(state, []);
      map.get(state).push(city);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [query]);

  return (
    <div className="ct-stack-sm">
      <input
        type="search"
        className={fieldClass}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("citySelect.searchPlaceholder")}
        autoComplete="off"
      />
      <select
        className={fieldClass}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="" disabled>
          Select your city
        </option>
        {grouped.map(([state, cities]) => (
          <optgroup key={state} label={state}>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {!value && (
        <span className="ct-caption">Default benchmark: {INDIAN_CITIES.find((c) => c.id === DEFAULT_CITY_ID)?.label}</span>
      )}
    </div>
  );
}
