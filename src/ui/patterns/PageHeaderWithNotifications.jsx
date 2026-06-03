import { useState } from "react";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { NotificationPanel } from "../features/NotificationPanel.jsx";
import { AppHeader } from "./PageHeader.jsx";
import { NotificationBell } from "./NotificationBell.jsx";

export function PageHeaderWithNotifications({ greeting }) {
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <AppHeader
        greeting={greeting}
        actions={<NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />}
      />
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
}

export default PageHeaderWithNotifications;
