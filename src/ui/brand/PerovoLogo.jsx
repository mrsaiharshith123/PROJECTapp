import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { assetUrl } from "../../utils/basePath.js";
import { brandIconForTheme } from "./brandAssets.js";
import { cn } from "../utils/cn.js";

/** @type {Record<string, number>} */
const SIZE_PX = {
  xs: 22,
  sm: 28,
  md: 44,
  lg: 68,
};

/**
 * Theme-aware Perovo app icon.
 * @param {{ size?: 'xs' | 'sm' | 'md' | 'lg' | number, className?: string, alt?: string }} props
 */
export function PerovoLogo({ size = "md", className = "", alt = "Perovo logo" }) {
  const theme = useResolvedTheme();
  const file = brandIconForTheme(theme);
  const px = typeof size === "number" ? size : SIZE_PX[size] || SIZE_PX.md;

  return (
    <img
      role="presentation"
      src={assetUrl(`brand/${file}`)}
      alt={alt}
      width={px}
      height={px}
      className={cn("ct-perovo-logo", className)}
      draggable={false}
    />
  );
}
