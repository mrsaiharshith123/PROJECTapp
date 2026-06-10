import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, Heading, Caption, Body, Badge } from "../../index.js";
import { formatInr } from "../../../constants/symbols.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { subscriptionLeakReport } from "../../../engines/subscriptionLeak.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { ProGate } from "../../patterns/ProGate.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { insightToneClass } from "../../tokens/severity.js";

export default function SubscriptionsAuditPanel() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus, todayStr } = useCommitTrack();

  const report = useMemo(
    () => subscriptionLeakReport(commitments, getEffectiveStatus, todayStr),
    [commitments, getEffectiveStatus, todayStr],
  );

  if (!tierHasFeature("subscription_leak", settings)) {
    return (
      <ProGate featureId="subscription_leak">
        <span className="sr-only">{t("subscriptions.auditTitle")}</span>
      </ProGate>
    );
  }

  if (report.count === 0) {
    return (
      <Card className="ct-stack-sm">
        <Heading level={3}>{t("subscriptions.auditTitle")}</Heading>
        <Caption>{t("subscriptions.auditEmpty")}</Caption>
      </Card>
    );
  }

  return (
    <Card className="ct-stack">
      <div className="ct-row-between gap-2 flex-wrap">
        <Heading level={3}>{t("subscriptions.auditTitle")}</Heading>
        <Badge tone="info">
          {t("subscriptions.tracked", { count: report.count })} · {formatInr(Math.round(report.monthlyEquivalent))}/mo
        </Badge>
      </div>
      <Caption className="block">{t("subscriptions.auditSubtitle")}</Caption>

      <div className="ct-stack-sm">
        {report.classified.map((row) => (
          <div key={row.name} className="ct-row-between gap-2 text-sm">
            <span className="truncate">
              {row.name}{" "}
              <span className="text-[var(--ct-text-muted)] text-xs">({row.tag})</span>
            </span>
            <span className="shrink-0 font-semibold">{formatInr(row.monthly)}</span>
          </div>
        ))}
      </div>

      {report.insights.length > 0 && (
        <ul className="ct-stack-sm">
          {report.insights.map((ins) => (
            <li
              key={ins.id}
              className={`text-sm rounded-lg px-3 py-2 border ${insightToneClass(ins.tone)}`}
            >
              {translateInsight(t, ins)}
            </li>
          ))}
        </ul>
      )}

      <Body className="!text-xs">
        <Link to="/commitments" className="ct-link">
          {t("subscriptions.reviewBills")}
        </Link>
      </Body>
    </Card>
  );
}
