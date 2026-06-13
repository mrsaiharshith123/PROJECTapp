import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { assetUrl } from "../../utils/basePath.js";
import { cn } from "../utils/cn.js";

/** @type {Record<string, number>} */
const HEIGHT_PX = {
  xs: 13,
  sm: 30,
  md: 40,
  lg: 56,
};

/**
 * Theme-aware Perovo wordmark (name + tagline image).
 * @param {{ size?: 'xs' | 'sm' | 'md' | 'lg', className?: string, alt?: string }} props
 */
export function PerovoWordmark({ size = "md", className = "", alt = "Perovo" }) {
  const theme = useResolvedTheme();
  const file = theme === "dark" ? "wordmark-dark.png" : "wordmark-light.png";
  const height = HEIGHT_PX[size] || HEIGHT_PX.md;

  return (
    <img
      src={assetUrl(`brand/${file}`)}
      alt={alt}
      height={height}
      className={cn("ct-perovo-wordmark", `ct-perovo-wordmark-${size}`, className)}
      draggable={false}
    />
  );
}
