import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { Button } from "../primitives/Button.jsx";
import { Badge } from "../primitives/Badge.jsx";
import { Heading, Body, Caption } from "../primitives/Text.jsx";
import { Card } from "../primitives/Card.jsx";

export function NotificationPanel({ onClose }) {
  const panelRef = useRef(null);
  const { markNotificationRead, markAllNotificationsRead } = useCommitTrack();
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
      <div ref={panelRef} className="ct-notif-panel" role="dialog" aria-label="Reminders">
        <Card variant="flat" className="!p-0 overflow-hidden">
          <div className="ct-row-between px-4 py-3 border-b border-[var(--ct-border)]">
            <Heading level={2}>Reminders</Heading>
            <div className="ct-row">
              {unread > 0 && <Badge tone="danger">{unread} new</Badge>}
              <button type="button" onClick={onClose} className="ct-btn ct-btn-ghost ct-btn-sm" aria-label="Close">
                ×
              </button>
            </div>
          </div>
          <div className="ct-notif-list">
            {notifications.length === 0 ? (
              <Caption className="block py-6 text-center">No reminders right now.</Caption>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li key={n.id} className={n.read ? "ct-notif-item" : "ct-notif-item ct-notif-item-unread"}>
                    <div className="ct-row-between items-start">
                      <div>
                        <Body className="text-[var(--ct-text)]">{n.message}</Body>
                        <Caption className="uppercase font-semibold mt-1 block">{n.urgency}</Caption>
                      </div>
                      {!n.read && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => markNotificationRead(n.id)}>
                          Read
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {notifications.length > 0 && unread > 0 && (
            <div className="px-4 py-3 border-t border-[var(--ct-border)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => markAllNotificationsRead(notifications.map((n) => n.id))}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </Card>
      </div>
    </>,
    document.body
  );
}

export default NotificationPanel;
