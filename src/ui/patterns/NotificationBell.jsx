import { cn } from "../utils/cn.js";

export function NotificationBell({ unread = 0, onClick, className = "" }) {
  return (
    <button type="button" onClick={onClick} className={cn("ct-notif-btn", className)} aria-label="Notifications">
      🔔
      {unread > 0 && (
        <span className="ct-notif-badge">{unread > 9 ? "9+" : unread}</span>
      )}
    </button>
  );
}
