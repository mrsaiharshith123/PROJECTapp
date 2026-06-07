import { Card } from "../../primitives/Card.jsx";
import { Caption, Body } from "../../primitives/Text.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";

/**
 * @param {{ eyebrow: string, title?: import('react').ReactNode, detail?: string, empty?: string, icon?: string }} props
 */
export function InsightStatCard({ eyebrow, title, detail, empty, icon }) {
  return (
    <Card>
      <Caption className="font-semibold uppercase tracking-wide mb-1">{eyebrow}</Caption>
      {title ? (
        <>
          <p className="ct-display text-lg flex items-center gap-2">
            {icon ? (
              <span className="inline-flex shrink-0" aria-hidden>
                <CtIcon name={icon} size={20} />
              </span>
            ) : null}
            {title}
          </p>
          {detail ? <Body className="!text-sm mt-1">{detail}</Body> : null}
        </>
      ) : (
        <Body className="!text-sm">{empty}</Body>
      )}
    </Card>
  );
}
