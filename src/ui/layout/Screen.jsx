export function Screen({ children, className = "", narrow = false }) {
  return (
    <div className={`ed-screen ${narrow ? "ed-screen-narrow" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function MainContent({ children, className = "" }) {
  return <main className={`ed-main max-w-lg mx-auto w-full ${className}`.trim()}>{children}</main>;
}

/**
 * @param {{ title?: string, children: import('react').ReactNode, action?: import('react').ReactNode }} props
 */
export function ScreenSection({ title, children, action }) {
  return (
    <section className="ed-section">
      {(title || action) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          {title && <h2 className="ed-section-title">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
