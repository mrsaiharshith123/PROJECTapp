import { CtIcon } from "../icons/CtIcon.jsx";

export function NotificationBell({ unread = 0, onClick }) {
  return (
    <button type="button" className="ct-notif-bell" onClick={onClick} aria-label="Notifications">
      <CtIcon name="bell" size={20} />
      {unread > 0 && <span className="ct-notif-dot">{unread > 9 ? "9+" : unread}</span>}
    </button>
  );
}

export default NotificationBell;
