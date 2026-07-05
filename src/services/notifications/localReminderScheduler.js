import { parseISO, addDays, setHours, setMinutes, setSeconds, setMilliseconds, isBefore } from "date-fns";
import { buildContextualReminderFeed } from "../../engines/notifications.js";
import { isNativeCapacitorShell } from "../../utils/nativePermissions.js";

const CHANNEL_ID = "perovo-reminders";
const MAX_SCHEDULED = 48;
const REMINDER_HOUR = 9;

/** Stable numeric id for Capacitor LocalNotifications (1 … 2147480000). */
export function stableLocalNotifId(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 2147000000 + 1;
}

function notificationId(r) {
  const id = String(r.id);
  if (id.startsWith("lend-")) return `l-${id}`;
  return `c-${id}`;
}

function atLocalTime(ymd, hour = REMINDER_HOUR) {
  const base = parseISO(`${ymd}T12:00:00`);
  let at = setMilliseconds(setSeconds(setMinutes(setHours(base, hour), 0), 0), 0);
  if (isBefore(at, new Date())) {
    at = new Date(Date.now() + 60_000);
  }
  return at;
}

/**
 * Build OS schedule rows from commitments/lending reminders.
 * @param {object} input
 * @param {(key: string, params?: object) => string} t
 */
export function buildLocalReminderSchedule({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
  readIds = [],
  t,
}) {
  const readSet = new Set((readIds || []).map(String));
  const contextual = buildContextualReminderFeed({
    commitments,
    lendings,
    settings: settings || {},
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
  });

  /** @type {{ id: number, key: string, title: string, body: string, at: Date, route?: string }[]} */
  const rows = [];

  for (const r of contextual) {
    const nid = notificationId(r);
    if (readSet.has(nid) || readSet.has(String(r.id))) continue;
    if (!r.dueDate) continue;

    const title =
      r.urgency === "critical"
        ? t("notifications.title.overdue")
        : r.urgency === "high"
          ? t("notifications.title.dueSoon")
          : t("notifications.title.reminder");

    let body = r.messageKey ? t(r.messageKey, r.messageParams || {}) : r.name || "";
    if (r.suffixKey) body += t(r.suffixKey, r.suffixParams || {});

    if (r.urgency === "critical") {
      for (let day = 0; day < 7; day++) {
        const ymd = formatYmd(addDays(parseISO(`${todayStr}T12:00:00`), day));
        const key = `local-${nid}-od-${day}`;
        rows.push({
          id: stableLocalNotifId(key),
          key,
          title,
          body,
          at: atLocalTime(ymd),
          route: r.href || "/ledger/bills",
        });
      }
      continue;
    }

    const key = `local-${nid}-due`;
    rows.push({
      id: stableLocalNotifId(key),
      key,
      title,
      body,
      at: atLocalTime(r.dueDate),
      route: r.href || "/ledger/bills",
    });
  }

  return rows
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}

function formatYmd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

let channelReady = false;

async function ensureReminderChannel() {
  if (channelReady || !isNativeCapacitorShell()) return;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: "Bill reminders",
    description: "Due and overdue bill reminders from Perovo",
    importance: 4,
    visibility: 1,
  });
  channelReady = true;
}

/**
 * Cancel pending local reminders and schedule fresh ones (native shell only).
 * @param {ReturnType<typeof buildLocalReminderSchedule>} rows
 */
export async function applyLocalReminderSchedule(rows) {
  if (!isNativeCapacitorShell() || !rows?.length) {
    if (isNativeCapacitorShell()) {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications");
        const pending = await LocalNotifications.getPending();
        const ids = (pending.notifications || []).map((n) => ({ id: n.id }));
        if (ids.length) await LocalNotifications.cancel({ notifications: ids });
      } catch {
        /* ignore */
      }
    }
    return { scheduled: 0 };
  }

  const { LocalNotifications } = await import("@capacitor/local-notifications");
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== "granted") return { scheduled: 0, reason: "denied" };

  await ensureReminderChannel();

  try {
    const pending = await LocalNotifications.getPending();
    const cancelIds = (pending.notifications || []).map((n) => ({ id: n.id }));
    if (cancelIds.length) await LocalNotifications.cancel({ notifications: cancelIds });
  } catch {
    /* ignore */
  }

  await LocalNotifications.schedule({
    notifications: rows.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      channelId: CHANNEL_ID,
      schedule: { at: row.at, allowWhileIdle: true },
      extra: { route: row.route, key: row.key },
    })),
  });

  return { scheduled: rows.length };
}

export function canScheduleLocalReminders() {
  return isNativeCapacitorShell();
}
