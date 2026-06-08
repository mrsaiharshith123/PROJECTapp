import { useTranslation } from "../../i18n/I18nProvider.js";
import { translatePriority } from "../../i18n/domainLabels.js";
import { Badge } from "../primitives/Badge.jsx";
import { priorityBadgeTone } from "../tokens/priorityBadges.js";

export function PriorityBadge({ priorityId, className = "" }) {
  const { t } = useTranslation();
  return (
    <Badge tone={priorityBadgeTone(priorityId)} className={className}>
      {translatePriority(t, priorityId)}
    </Badge>
  );
}

export default PriorityBadge;
