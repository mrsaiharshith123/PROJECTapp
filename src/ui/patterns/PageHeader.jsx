import { Row } from "../primitives/Stack.jsx";
import { Heading, Eyebrow, Caption } from "../primitives/Text.jsx";

/**
 * @param {{ title: string, eyebrow?: string, subtitle?: import('react').ReactNode, actions?: import('react').ReactNode }} props
 */
export function PageHeader({ title, eyebrow, subtitle, actions }) {
  return (
    <Row between className="items-start">
      <div className="min-w-0 flex-1">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading level={1} className={eyebrow ? "mt-1" : ""}>
          {title}
        </Heading>
        {subtitle && <div className="mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </Row>
  );
}

export function AppHeader({ greeting, actions }) {
  return (
    <Row between>
      <div>
        <Caption>CommitTrack</Caption>
        <p className="ct-greeting mt-0.5">{greeting}</p>
      </div>
      {actions}
    </Row>
  );
}
