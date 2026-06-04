import { pickMicroTip } from "../../guidance/index.js";
import { Card } from "../primitives/Card.jsx";
import { Caption, Eyebrow } from "../primitives/Text.jsx";

/** Lightweight learning moment — one calm line. */
export function MicroTipCard({ seed = 0 }) {
  const tip = pickMicroTip(seed);
  return (
    <Card variant="flat" className="ct-guidance-micro">
      <Eyebrow>Quick insight</Eyebrow>
      <Caption className="block mt-1">{tip}</Caption>
    </Card>
  );
}

export default MicroTipCard;
