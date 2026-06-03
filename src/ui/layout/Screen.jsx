export function Screen({ children, className = "", narrow = false }) {
  return (
    <div className={`ct-screen ${narrow ? "ct-screen-narrow" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function MainContent({ children, className = "" }) {
  return (
    <main className={`ct-main max-w-lg mx-auto w-full px-4 ${className}`.trim()}>
      {children}
    </main>
  );
}

/**
 * @param {{ title?: string, children: import('react').ReactNode, action?: import('react').ReactNode }} props
 */
export function ScreenSection({ title, children, action }) {
  return (
    <section className="ct-section">
      {(title || action) && (
        <div className="ct-row-between mb-3">
          {title && <h2 className="ct-h2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
