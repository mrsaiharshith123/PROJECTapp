import { ToneSurface } from "../patterns/ToneSurface.jsx";
import { Eyebrow, Body } from "../primitives/Text.jsx";

const TONE_MAP = {
  warning: "warning",
  info: "info",
  positive: "success",
};

/** Dashboard attention — where to look first. */
export function GuidanceBanner({ focus }) {
  if (!focus?.message) return null;
  const tone = TONE_MAP[focus.tone] || "info";

  return (
    <ToneSurface tone={tone} className="ct-guidance-banner">
      {focus.label && <Eyebrow>{focus.label}</Eyebrow>}
      <Body className="!text-sm">{focus.message}</Body>
    </ToneSurface>
  );
}
