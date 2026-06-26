import { cn } from "../utils/cn.js";
import { AppHeaderActions } from "./AppHeaderActions.jsx";

/**
 * Standard page layout — title, optional subtitle, header action, scrollable body.
 * @param {import('react').PropsWithChildren<{ title?: string, subtitle?: string, action?: import('react').ReactNode, headerAux?: import('react').ReactNode, scroll?: boolean, className?: string, hidePrivacyToggle?: boolean, hideAvatar?: boolean }>} props
 */
export function PageShell({
  title,
  subtitle,
  action,
  headerAux,
  children,
  scroll = true,
  className = "",
  hidePrivacyToggle = false,
  hideAvatar = false,
}) {
  const showHead = Boolean(title || subtitle || action || !hidePrivacyToggle || headerAux);

  return (
    <div className={cn("ct-page-shell", className)}>
      {showHead && (
        <header className="ct-page-shell-head">
          <div className="ct-page-shell-titles">
            {title ? <h1 className="ct-page-shell-title">{title}</h1> : null}
            {subtitle ? <p className="ct-page-shell-subtitle">{subtitle}</p> : null}
          </div>
          <div className="ct-page-shell-action">
            <AppHeaderActions
              hidePrivacyToggle={hidePrivacyToggle}
              headerAux={headerAux}
              action={action}
              hideAvatar={hideAvatar}
            />
          </div>
        </header>
      )}
      <div className={cn("ct-page-shell-body", scroll && "ct-page-shell-scroll")}>{children}</div>
    </div>
  );
}

export default PageShell;
