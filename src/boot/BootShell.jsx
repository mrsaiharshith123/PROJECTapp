/** Zero-hook boot fallback — safe before any React context exists (OTA multi-chunk boot). */
export default function BootShell({ message = "Starting Perovo…" }) {
  return (
    <div className="ct-load-scene ct-load-scene-full" role="status" aria-live="polite" aria-busy="true">
      <div className="ct-load-center">
        <p className="ct-load-message" style={{ textAlign: "center" }}>
          {message}
        </p>
        <div className="ct-load-progress" aria-hidden>
          <span className="ct-load-progress-bar" />
        </div>
      </div>
    </div>
  );
}
