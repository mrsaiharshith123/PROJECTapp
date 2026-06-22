import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { translateNotification } from "../../i18n/notificationLabels.js";
import { Button } from "../primitives/Button.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { Heading, Caption } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";
import { cn } from "../utils/cn.js";

const URGENCY_ICON = {
  critical: { icon: "warning", tone: "danger" },
  high: { icon: "warning", tone: "amber" },
  normal: { icon: "bell", tone: "indigo" },
  low: { icon: "check", tone: "teal" },
};

function formatNotifTime(createdAt) {
  if (!createdAt) return "";
  try {
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  } catch {
    return "";
  }
}

export function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { markNotificationRead, markAllNotificationsRead } = usePerovo();
  const { notifications } = useCommitIntel();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onScroll = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div className="ct-notif-overlay" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        className="ct-notif-panel"
        role="dialog"
        aria-label={t("notifications.panel.title")}
      >
        <div className="ct-nw-panel !p-0 overflow-hidden">
          <div className="ct-row-between px-4 py-3 border-b border-[var(--ct-border)]">
            <Heading level={2}>{t("notifications.panel.title")}</Heading>
            <div className="ct-row">
              {unread > 0 ? (
                <Badge tone="danger">{t("notifications.panel.new", { count: unread })}</Badge>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="ct-btn ct-btn-ghost ct-btn-sm"
                aria-label={t("notifications.panel.close")}
              >
                ×
              </button>
            </div>
          </div>
          <div className="ct-notif-list">
            {notifications.length === 0 ? (
              <Caption className="block py-6 text-center">{t("notifications.panel.empty")}</Caption>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const copy = translateNotification(t, n);
                  const meta = URGENCY_ICON[n.urgency] || URGENCY_ICON.normal;
                  const timeAgo = formatNotifTime(n.createdAt);
                  return (
                    <li
                      key={n.id}
                      className={cn("ct-notif-item", !n.read && "ct-notif-item-unread")}
                    >
                      <div className="ct-notif-item-row">
                        <span className={cn("ct-notif-icon-tile ct-icon-tile ct-icon-tile-sm", meta.tone)} aria-hidden>
                          <CtIcon name={meta.icon} size={18} />
                        </span>
                        <div className="ct-notif-item-body">
                          <p className="ct-notif-item-title">{copy.title || copy.message}</p>
                          {copy.title && copy.message ? (
                            <Caption className="block mt-0.5 leading-snug">{copy.message}</Caption>
                          ) : null}
                          {timeAgo ? <p className="ct-notif-item-time">{timeAgo}</p> : null}
                        </div>
                        <div className="ct-row gap-1 shrink-0">
                          {"href" in n && n.href ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                markNotificationRead(n.id);
                                onClose();
                                navigate(String(n.href));
                              }}
                            >
                              {"actionKey" in n && n.actionKey
                                ? t("notifications.panel.open")
                                : t("notifications.panel.view")}
                            </Button>
                          ) : null}
                          {!n.read ? (
                            <Button type="button" variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
                              {t("notifications.panel.read")}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {notifications.length > 0 && unread > 0 ? (
            <div className="px-4 py-3 border-t border-[var(--ct-border)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => markAllNotificationsRead(notifications.map((n) => n.id))}
              >
                {t("notifications.markRead")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </>,
    document.body,
  );
}

export default NotificationPanel;
