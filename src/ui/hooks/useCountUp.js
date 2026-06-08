import { useEffect, useState } from "react";

/**
 * Animated count-up for hero metrics.
 * @param {number} target
 * @param {number} [durationMs]
 */
export function useCountUp(target, durationMs = 900) {
  const end = Math.max(0, Number(target) || 0);
  const [value, setValue] = useState(end);

  useEffect(() => {
    if (end === 0) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(end * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [end, durationMs]);

  return end === 0 ? 0 : value;
}
