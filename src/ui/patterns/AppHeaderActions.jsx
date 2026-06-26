import { useState } from "react";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { PrivacyToggleButton } from "./PrivacyToggleButton.jsx";
import { NotificationBell } from "./NotificationBell.jsx";
import { AppHeaderAvatar } from "../layout/AppHeaderAvatar.jsx";
import { NotificationPanel } from "../features/NotificationPanel.jsx";

/**
 * Global header actions — privacy, optional slots, bell, then profile (rightmost).
 * @param {{
 *   hidePrivacyToggle?: boolean,
 *   headerAux?: import('react').ReactNode,
 *   action?: import('react').ReactNode,
 *   hideAvatar?: boolean,
 * }} props
 */
export function AppHeaderActions({
  hidePrivacyToggle = false,
  headerAux = null,
  action = null,
  hideAvatar = false,
}) {
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      {!hidePrivacyToggle ? <PrivacyToggleButton /> : null}
      {headerAux}
      {action}
      <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
      {!hideAvatar ? <AppHeaderAvatar /> : null}
      {showNotifications ? <NotificationPanel onClose={() => setShowNotifications(false)} /> : null}
    </>
  );
}

export default AppHeaderActions;
