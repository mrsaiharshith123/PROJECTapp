import { useNavigate } from "react-router-dom";
import { getEmptyStateGuidance } from "../../guidance/index.js";
import { EmptyState } from "../patterns/EmptyState.jsx";
import { Button } from "../primitives/Button.jsx";

/**
 * Empty state with mode-specific education.
 * @param {{ guidanceKey: string, settings: object }} props
 */
export function GuidedEmptyState({ guidanceKey, settings }) {
  const navigate = useNavigate();
  const g = getEmptyStateGuidance(guidanceKey, settings);

  return (
    <div className="ct-stack ct-stack-center">
      <EmptyState icon={g.icon} title={g.title} hint={g.hint} />
      {g.actionPath && g.actionLabel && (
        <Button type="button" variant="primary" size="md" onClick={() => navigate(g.actionPath)}>
          {g.actionLabel}
        </Button>
      )}
    </div>
  );
}

export default GuidedEmptyState;
