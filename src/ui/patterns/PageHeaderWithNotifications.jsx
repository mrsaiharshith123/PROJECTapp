import { useState } from "react";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { NotificationPanel } from "../features/NotificationPanel.jsx";
import { AppHeader } from "./PageHeader.jsx";
import { NotificationBell } from "./NotificationBell.jsx";

export function PageHeaderWithNotifications({ greeting, headerActions, showBrand = true }) {
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <AppHeader
        greeting={greeting}
        showBrand={showBrand}
        actions={
          <div className="ct-row gap-2 shrink-0">
            {headerActions}
            <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
          </div>
        }
      />
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
}

export default PageHeaderWithNotifications;
