import { pickMicroTip } from "../../guidance/index.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { Card } from "../primitives/Card.jsx";
import { Caption, Eyebrow } from "../primitives/Text.jsx";

/** Lightweight learning moment — one calm line. */
export function MicroTipCard({ seed = 0 }) {
  const { t } = useTranslation();
  const tipKey = pickMicroTip(seed);
  return (
    <Card variant="flat" className="ed-inset">
      <Eyebrow>{t("guidance.insight")}</Eyebrow>
      <Caption className="block mt-1">{t(tipKey)}</Caption>
    </Card>
  );
}
