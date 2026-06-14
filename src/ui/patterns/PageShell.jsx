import { cn } from "../utils/cn.js";

/**
 * Standard page layout — title, optional subtitle, header action, scrollable body.
 * @param {import('react').PropsWithChildren<{ title?: string, subtitle?: string, action?: import('react').ReactNode, scroll?: boolean, className?: string }>} props
 */
export function PageShell({ title, subtitle, action, children, scroll = true, className = "" }) {
  return (
    <div className={cn("ct-page-shell", className)}>
      {(title || action) && (
        <header className="ct-page-shell-head">
          <div className="ct-page-shell-titles">
            {title ? <h1 className="ct-page-shell-title">{title}</h1> : null}
            {subtitle ? <p className="ct-page-shell-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="ct-page-shell-action">{action}</div> : null}
        </header>
      )}
      <div className={cn("ct-page-shell-body", scroll && "ct-page-shell-scroll")}>{children}</div>
    </div>
  );
}

export default PageShell;
