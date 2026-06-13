import { useTranslation } from "../../i18n/I18nProvider.js";
import { cn } from "../utils/cn.js";
import { PerovoLogo } from "./PerovoLogo.jsx";
import { PerovoWordmark } from "./PerovoWordmark.jsx";

/**
 * Icon + official wordmark lockup.
 * @param {{
 *   layout?: 'row' | 'column',
 *   iconSize?: 'xs' | 'sm' | 'md' | 'lg',
 *   wordmarkSize?: 'xs' | 'sm' | 'md' | 'lg',
 *   className?: string,
 * }} props
 */
export function PerovoBrand({
  layout = "row",
  iconSize = "sm",
  wordmarkSize = "sm",
  className = "",
}) {
  const { t } = useTranslation();
  const label = t("brand.appName");

  return (
    <div
      className={cn("ct-perovo-brand", `ct-perovo-brand-${layout}`, className)}
      aria-label={label}
      role="img"
    >
      <PerovoLogo size={iconSize} alt="" />
      <PerovoWordmark size={wordmarkSize} alt="" />
    </div>
  );
}
