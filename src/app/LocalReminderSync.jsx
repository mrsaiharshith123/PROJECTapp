import { useEffect, useRef } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useTranslation } from "../i18n/I18nProvider.js";
import { getEffectiveLendingStatus } from "../utils/lendingStatus.js";
import { DATA_CHANGED_EVENT } from "../utils/storage/events.js";
import {
  applyLocalReminderSchedule,
  buildLocalReminderSchedule,
  canScheduleLocalReminders,
} from "../services/notifications/localReminderScheduler.js";

/** Schedules native OS reminders for bill due dates (works when app is closed). */
export default function LocalReminderSync() {
  const { t } = useTranslation();
  const { commitments, lendings, settings, todayStr, getEffectiveStatus } = usePerovo();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!canScheduleLocalReminders()) return;

    if (settings.remindersEnabled === false) {
      applyLocalReminderSchedule([]).catch(() => {});
      return;
    }

    const sync = () => {
      const rows = buildLocalReminderSchedule({
        commitments,
        lendings,
        settings,
        getEffectiveStatus,
        getEffectiveLendingStatus: (l) => getEffectiveLendingStatus(l, todayStr),
        todayStr,
        readIds: settings.readNotificationIds,
        t,
      });
      applyLocalReminderSchedule(rows).catch(() => {});
    };

    const schedule = () => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(sync, 800);
    };

    schedule();
    window.addEventListener(DATA_CHANGED_EVENT, schedule);
    return () => {
      clearTimeout(debounceRef.current);
      window.removeEventListener(DATA_CHANGED_EVENT, schedule);
    };
  }, [
    commitments,
    lendings,
    settings,
    settings.remindersEnabled,
    settings.readNotificationIds,
    todayStr,
    getEffectiveStatus,
    t,
  ]);

  return null;
}
