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
 * @param {{ size?: 'xs' | 'sm' | 'md' | 'lg', variant?: 'full' | 'nameOnly', className?: string, alt?: string }} props
 */
export function PerovoWordmark({ size = "md", variant = "full", className = "", alt = "Perovo" }) {
  const theme = useResolvedTheme();
  const file = theme === "dark" ? "wordmark-dark.png" : "wordmark-light.png";
  const height = HEIGHT_PX[size] || HEIGHT_PX.md;
  const url = assetUrl(`brand/${file}`);

  if (variant === "nameOnly") {
    return (
      <span
        className={cn("ct-perovo-wordmark-name", `ct-perovo-wordmark-name-${size}`, className)}
        style={{ backgroundImage: `url("${url}")` }}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      height={height}
      className={cn("ct-perovo-wordmark", `ct-perovo-wordmark-${size}`, className)}
      draggable={false}
    />
  );
}
