import { Button, Caption, Body } from "../../index.js";

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const LEVEL_CLASS = {
  success: "ct-text-success",
  warn: "ct-text-warning",
  error: "ct-text-danger",
  info: "",
};

/**
 * @param {{ activity: Array<{ id: string, ts: string, level: string, message: string, detail?: string }>, onClear?: () => void }} props
 */
export default function AccountActivityLog({ activity, onClear }) {
  if (!activity?.length) {
    return (
      <Caption className="block opacity-80">
        Sign-in, cloud backup, and profile events will appear here for transparency.
      </Caption>
    );
  }

  return (
    <div className="ct-stack-sm">
      <ul className="ct-stack-sm max-h-48 overflow-y-auto">
        {activity.map((entry) => (
          <li key={entry.id} className="ct-hero-inset !p-2.5">
            <div className="ct-row-between gap-2">
              <Body className={`!text-xs font-medium ${LEVEL_CLASS[entry.level] || ""}`}>{entry.message}</Body>
              <Caption className="shrink-0 !text-[10px]">{formatTime(entry.ts)}</Caption>
            </div>
            {entry.detail && <Caption className="block mt-0.5 opacity-75">{entry.detail}</Caption>}
          </li>
        ))}
      </ul>
      {onClear && (
        <Button type="button" variant="ghost" size="sm" className="!w-auto self-start" onClick={onClear}>
          Clear activity log
        </Button>
      )}
    </div>
  );
}
