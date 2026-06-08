import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { Select } from "../../../primitives/Input.jsx";
import { Caption } from "../../../primitives/Text.jsx";

/** @type {{ id: 'line' | 'bar' | 'pie' | 'donut', label: string }[]} */
const CHART_TYPE_OPTIONS = [
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "pie", label: "Pie" },
  { id: "donut", label: "Donut" },
];

/** @param {{ value: string, onChange: (id: import('./FlexibleDataChart.jsx').ChartTypeId) => void, allowed?: string[], className?: string }} props */
export function ChartTypeSelect({ value, onChange, allowed, className = "" }) {
  const { t } = useTranslation();
  const options = allowed?.length
    ? CHART_TYPE_OPTIONS.filter((o) => allowed.includes(o.id))
    : CHART_TYPE_OPTIONS;
  const labelKeys = {
    bar: "charts.typeBar",
    line: "charts.typeLine",
    pie: "charts.typePie",
    donut: "charts.typeDonut",
  };

  return (
    <label className={`ct-row gap-2 items-center ${className}`.trim()}>
      <Caption className="shrink-0">{t("charts.graphType")}</Caption>
      <Select
        className="!w-auto min-w-[7rem] text-sm"
        value={value}
        onChange={(e) => onChange(/** @type {import('./FlexibleDataChart.jsx').ChartTypeId} */ (e.target.value))}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {t(labelKeys[o.id] || o.id)}
          </option>
        ))}
      </Select>
    </label>
  );
}
