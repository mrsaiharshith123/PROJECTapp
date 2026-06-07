import { useNavigate } from "react-router-dom";
import { getEmptyStateGuidance } from "../../guidance/index.js";
import { EmptyState } from "../patterns/EmptyState.jsx";
import { Button } from "../primitives/Button.jsx";
import { useTranslation } from "../../i18n/I18nProvider.jsx";

/**
 * Empty state with mode-specific education.
 * @param {{ guidanceKey: string, settings: object }} props
 */
export function GuidedEmptyState({ guidanceKey, settings }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const g = getEmptyStateGuidance(guidanceKey, settings);

  return (
    <div className="ct-stack ct-stack-center">
      <EmptyState icon={g.icon} title={t(g.titleKey)} hint={t(g.hintKey)} />
      {g.actionPath && g.actionLabelKey && (
        <Button type="button" variant="primary" size="md" onClick={() => navigate(g.actionPath)}>
          {t(g.actionLabelKey)}
        </Button>
      )}
    </div>
  );
}

export default GuidedEmptyState;
