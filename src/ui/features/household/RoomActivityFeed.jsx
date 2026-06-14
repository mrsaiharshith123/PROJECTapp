import { useEffect, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ScreenSection, Card, Body, Caption, CtIcon } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { formatInr } from "../../../constants/symbols.js";
import { loadRoomEvents } from "../../../services/household/householdRoomService.js";

const EVENT_ICONS = {
  bill_paid: { name: "check", tone: "success" },
  bill_added: { name: "plus", tone: "info" },
  bill_overdue: { name: "warning", tone: "danger" },
  goal_progress: { name: "chart-line-up", tone: "teal" },
  pressure_changed: { name: "chart-line-up", tone: "warning" },
  member_joined: { name: "users-three", tone: "info" },
  loan_lent: { name: "handshake", tone: "info" },
  loan_received: { name: "handshake", tone: "warning" },
};

/**
 * @param {(key: string, params?: object) => string} t
 * @param {object} event
 */
function eventLabel(t, event) {
  const d = event.event_data || {};
  const name = event.display_name || "";
  switch (event.event_type) {
    case "bill_paid":
      return t("household.activity.billPaid", { name, bill: d.name || "" });
    case "bill_added":
      return t("household.activity.billAdded", {
        name,
        bill: d.name || "",
        amount: formatInr(Number(d.amount) || 0),
      });
    case "bill_overdue":
      return t("household.activity.billOverdue", { bill: d.name || "" });
    case "goal_progress":
      return t("household.activity.goalProgress", {
        name,
        goal: d.goalName || "",
        pct: d.pct ?? 0,
      });
    case "member_joined":
      return t("household.activity.memberJoined", { name });
    case "pressure_changed":
      return t("household.activity.pressureChanged", {
        from: d.from ?? "",
        to: d.to ?? "",
        direction: d.direction || "stable",
      });
    case "loan_lent":
      return t("household.activity.loanLent", { name, to: d.to || "", amount: formatInr(Number(d.amount) || 0) });
    case "loan_received":
      return t("household.activity.loanReceived", { name, from: d.from || "", amount: formatInr(Number(d.amount) || 0) });
    default:
      return t("household.activity.generic", { name });
  }
}

/**
 * @param {{ roomId: string, maxItems?: number }} props
 */
export default function RoomActivityFeed({ roomId, maxItems = 10 }) {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;

    const refresh = async () => {
      const rows = await loadRoomEvents(roomId, maxItems);
      if (!cancelled) setEvents(rows);
    };

    refresh();
    const timer = setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomId, maxItems]);

  if (!roomId) return null;

  const iconFor = (type) => EVENT_ICONS[type] || { name: "bell", tone: "neutral" };

  return (
    <ScreenSection title={t("household.activity.title")}>
      <Card className="ct-stack-sm">
        {events.length === 0 ? (
          <Caption>{t("household.activity.empty")}</Caption>
        ) : (
          events.map((ev) => {
            const icon = iconFor(ev.event_type);
            return (
              <div key={ev.id} className="ct-row gap-2 items-start py-1">
                <span className={`ct-icon-box ct-icon-tone-${icon.tone}`}>
                  <CtIcon name={icon.name} size={18} context="status" />
                </span>
                <div className="min-w-0 flex-1">
                  <Body className="!text-sm leading-snug">{eventLabel(t, ev)}</Body>
                  <Caption className="block">
                    {ev.created_at
                      ? formatDistanceToNow(parseISO(ev.created_at), { addSuffix: true })
                      : ""}
                  </Caption>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </ScreenSection>
  );
}
