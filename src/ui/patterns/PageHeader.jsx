import { Row } from "../primitives/Stack.jsx";
import { Heading, Eyebrow } from "../primitives/Text.jsx";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { PerovoWordmark } from "../brand/PerovoWordmark.jsx";

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

export function AppHeader({ greeting, actions, showBrand = true }) {
  const { t } = useTranslation();
  return (
    <Row between>
      <div>
        {showBrand ? <PerovoWordmark size="sm" alt={t("brand.appName")} /> : null}
        <p className={`ct-greeting ${showBrand ? "mt-0.5" : ""}`}>{greeting}</p>
      </div>
      {actions}
    </Row>
  );
}
