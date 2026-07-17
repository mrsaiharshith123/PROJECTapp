import { useCallback, useMemo, useRef, useEffect } from "react";
import { normalizeCommitmentStatusForSave, getEffectiveStatus } from "../utils/commitmentStatus.js";
import { applyPaymentToCommitment, totalPaidOnPayments } from "../utils/commitmentPayments.js";
import { advanceRecurringCommitment } from "../utils/commitmentRecurring.js";
import {
  normalizeCommitment,
  normalizeLending,
  normalizeGoal,
} from "../utils/migrateStorage.js";
import { applyPaymentToLending } from "../utils/lendingStatus.js";
import { filterByProfile } from "../utils/profileScope.js";
import { USER_MODE_IDS } from "../constants/userModes.js";
import { canEditLending } from "../engines/lendingAgreement.js";
import { reconcileBillAfterEdit } from "../utils/billPaymentProgress.js";
import { normalizeAppLanguage } from "../i18n/languages.js";
import { trackEvent, EVENTS } from "../services/analytics/perovoAnalytics.js";

const INTEGRITY_SEAL_FIELDS = new Set([
  "agreementHash",
  "agreementSealedAt",
  "anchorProof",
  "anchorSubmittedAt",
  "anchorCalendarUrl",
]);

function settingsPatchUnchanged(prev, next, patch) {
  return Object.keys(patch).every((key) => {
    const before = prev[key];
    const after = next[key];
    if (Array.isArray(before) && Array.isArray(after)) {
      return JSON.stringify(before) === JSON.stringify(after);
    }
    return Object.is(before, after);
  });
}

/** @param {object} deps */
export function usePerovoCrud({
  commitments,
  settings,
  todayStr,
  userId,
  persistCommitments,
  persistLendings,
  persistSettings,
  persistGoals,
  setSupplementalNotifications,
}) {
  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const commitmentsRef = useRef(commitments);
  useEffect(() => {
    commitmentsRef.current = commitments;
  }, [commitments]);

  const addCommitment = useCallback(
    (raw) => {
      const now = Date.now();
      const currentSettings = settingsRef.current;
      const c = normalizeCommitment({
        ...raw,
        id: raw.id ?? now,
        profileId: raw.profileId ?? currentSettings.activeProfileId ?? "default",
        createdAt: now,
        updatedAt: now,
      });
      persistCommitments((prev) => [...prev, c]);
      trackEvent(EVENTS.COMMITMENT_ADDED, { category: c.category });
    },
    [persistCommitments]
  );

  const updateCommitment = useCallback(
    (id, patch) => {
      persistCommitments((prev) => {
        const all = prev;
        return prev.map((c) => {
          if (String(c.id) !== String(id)) return c;
          const merged = reconcileBillAfterEdit(
            c,
            { ...c, ...patch, id: c.id, updatedAt: Date.now() },
            todayStr,
            all
          );
          return normalizeCommitmentStatusForSave(normalizeCommitment(merged), todayStr, all);
        });
      });
    },
    [persistCommitments, todayStr]
  );

  const deleteCommitment = useCallback(
    (id) => {
      persistCommitments((prev) => prev.filter((c) => String(c.id) !== String(id)));
    },
    [persistCommitments]
  );

  const addCommitmentPayment = useCallback(
    (id, payment) => {
      let goalCredit = null;
      persistCommitments((prev) =>
        prev.flatMap((c) => {
          if (String(c.id) !== String(id)) return [c];
          const prevPaid = totalPaidOnPayments(c.payments);
          let updated = applyPaymentToCommitment(c, payment, prev, todayStr);
          const applied = totalPaidOnPayments(updated.payments) - prevPaid;
          if (applied > 0 && updated.goalId && updated.category === "SIP") {
            goalCredit = { goalId: updated.goalId, amount: applied };
          }
          updated = normalizeCommitmentStatusForSave(normalizeCommitment(updated), todayStr, prev);
          if (Number(updated.remainingAmount) > 0) return [updated];
          const nextId = Date.now() + Math.floor(Math.random() * 1000);
          const { paidRow, nextCycle } = advanceRecurringCommitment(updated, nextId);
          return nextCycle ? [paidRow, nextCycle] : [paidRow];
        })
      );
      if (goalCredit) {
        persistGoals((prev) =>
          prev.map((g) =>
            String(g.id) !== String(goalCredit.goalId)
              ? g
              : normalizeGoal({
                  ...g,
                  savedAmount: Math.max(0, Number(g.savedAmount) || 0) + goalCredit.amount,
                  updatedAt: Date.now(),
                })
          )
        );
      }
    },
    [persistCommitments, persistGoals, todayStr]
  );

  const removeCommitmentPayment = useCallback(
    (id, paymentIndex) => {
      persistCommitments((prev) =>
        prev.map((c) => {
          if (String(c.id) !== String(id)) return c;
          const payments = [...(c.payments || [])];
          const idx = Number(paymentIndex);
          if (idx < 0 || idx >= payments.length) return c;
          payments.splice(idx, 1);
          const merged = normalizeCommitment({ ...c, payments, updatedAt: Date.now() });
          return normalizeCommitmentStatusForSave(merged, todayStr, prev);
        })
      );
    },
    [persistCommitments, todayStr]
  );

  const addLending = useCallback(
    (raw) => {
      const now = Date.now();
      const total = Math.max(0, Number(raw.totalAmount) || 0);
      const l = normalizeLending({
        ...raw,
        id: raw.id ?? now,
        profileId: raw.profileId ?? settingsRef.current.activeProfileId ?? "default",
        createdAt: now,
        updatedAt: now,
        totalAmount: total,
        payments: [],
        remainingAmount: total,
        status: "pending",
      });
      persistLendings((prev) => [...prev, l]);
      trackEvent(EVENTS.LENDING_CREATED, { type: l.type });
    },
    [persistLendings]
  );

  const updateLending = useCallback(
    (id, patch) => {
      // Integrity-seal fields (document hash + external timestamp anchor)
      // describe evidence ABOUT the agreement, not its legal terms — these
      // must stay settable even once the agreement is locked, since sealing
      // typically happens right after finalization/eSign, which is exactly
      // when isAgreementFullyLocked starts returning true.
      const isIntegrityOnlyPatch = Object.keys(patch).every((k) => INTEGRITY_SEAL_FIELDS.has(k));
      persistLendings((prev) =>
        prev.map((l) => {
          if (String(l.id) !== String(id)) return l;
          if (!isIntegrityOnlyPatch && !canEditLending(l)) return l;
          return normalizeLending({
            ...l,
            ...patch,
            id: l.id,
            updatedAt: Date.now(),
          });
        })
      );
    },
    [persistLendings]
  );

  const deleteLending = useCallback(
    (id) => {
      persistLendings((prev) => {
        const row = prev.find((l) => String(l.id) === String(id));
        if (row?.agreementLocked) {
          const rem = Number(row.remainingAmount) || 0;
          const settled = rem <= 0 || row.status === "complete";
          const mutual =
            Boolean(row.mutualCancelBorrowerSign?.trim()) &&
            Boolean(row.mutualCancelLenderSign?.trim());
          if (!settled && !mutual) return prev;
        }
        return prev.filter((l) => String(l.id) !== String(id));
      });
    },
    [persistLendings]
  );

  const addLendingPayment = useCallback(
    (id, payment) => {
      persistLendings((prev) =>
        prev.map((l) => (String(l.id) !== String(id) ? l : applyPaymentToLending(l, payment, todayStr)))
      );
    },
    [persistLendings, todayStr]
  );

  const updateSettings = useCallback(
    (patch) => {
      persistSettings((prev) => {
        let next = { ...prev, ...patch };
        if (patch.userMode != null && !USER_MODE_IDS.includes(patch.userMode)) {
          next.userMode = prev.userMode || "salaried";
        }
        if ("subscriptionTier" in patch) {
          delete next.subscriptionTier;
        }
        if (patch.appLanguage != null) {
          next.appLanguage = normalizeAppLanguage(patch.appLanguage);
        }
        if (settingsPatchUnchanged(prev, next, patch)) return prev;
        return next;
      });
    },
    [persistSettings]
  );

  const addGoal = useCallback(
    (raw) => {
      const scoped = filterByProfile(commitmentsRef.current, settingsRef.current.activeProfileId || "default");
      const openSumScoped = scoped.reduce((s, c) => {
        if (getEffectiveStatus(c, todayStr) === "paid") return s;
        return s + Math.max(0, Number(c.remainingAmount ?? 0));
      }, 0);
      const g = normalizeGoal({
        ...raw,
        id: raw.id ?? Date.now(),
        profileId: raw.profileId ?? settingsRef.current.activeProfileId ?? "default",
        baselineOpenRemaining: raw.baselineOpenRemaining ?? openSumScoped,
      });
      persistGoals((prev) => [...prev, g]);
    },
    [persistGoals, todayStr]
  );

  const updateGoal = useCallback(
    (id, patch) => {
      persistGoals((prev) =>
        prev.map((g) =>
          String(g.id) !== String(id)
            ? g
            : normalizeGoal({
                ...g,
                ...patch,
                id: g.id,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistGoals]
  );

  const deleteGoal = useCallback(
    (id) => {
      persistGoals((prev) => prev.filter((g) => String(g.id) !== String(id)));
    },
    [persistGoals]
  );

  const pushInAppNotification = useCallback((item) => {
    const row = {
      id: item.id || `local-${Date.now()}`,
      message: item.message || "",
      urgency: item.urgency || "normal",
      createdAt: Date.now(),
      read: false,
    };
    setSupplementalNotifications((prev) => [row, ...prev.filter((n) => n.id !== row.id)]);
    return row;
  }, [setSupplementalNotifications]);

  const markNotificationRead = useCallback(
    (id) => {
      const sid = String(id);
      setSupplementalNotifications((prev) =>
        prev.map((n) => (n.id === sid ? { ...n, read: true } : n))
      );
      persistSettings((prev) => {
        const ids = new Set(prev.readNotificationIds || []);
        ids.add(sid);
        return { ...prev, readNotificationIds: [...ids] };
      });
    },
    [persistSettings, setSupplementalNotifications]
  );

  const markAllNotificationsRead = useCallback(
    (ids) => {
      const idList = ids.map(String);
      setSupplementalNotifications((prev) =>
        prev.map((n) => (idList.includes(String(n.id)) ? { ...n, read: true } : n)),
      );
      persistSettings((prev) => {
        const set = new Set([...(prev.readNotificationIds || []), ...idList]);
        return { ...prev, readNotificationIds: [...set] };
      });
    },
    [persistSettings, setSupplementalNotifications],
  );

  const logSavingsToGoal = useCallback(
    (goalId, amount) => {
      const amt = Math.max(0, Number(amount) || 0);
      if (amt <= 0) return;
      persistGoals((prev) =>
        prev.map((g) =>
          String(g.id) !== String(goalId)
            ? g
            : normalizeGoal({
                ...g,
                savedAmount: Math.max(0, Number(g.savedAmount) || 0) + amt,
                updatedAt: Date.now(),
              })
        )
      );
    },
    [persistGoals]
  );

  return useMemo(
    () => ({
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addCommitmentPayment,
      removeCommitmentPayment,
      addLending,
      updateLending,
      deleteLending,
      addLendingPayment,
      updateSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      pushInAppNotification,
      markNotificationRead,
      markAllNotificationsRead,
      logSavingsToGoal,
    }),
    [
      addCommitment,
      updateCommitment,
      deleteCommitment,
      addCommitmentPayment,
      removeCommitmentPayment,
      addLending,
      updateLending,
      deleteLending,
      addLendingPayment,
      updateSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      pushInAppNotification,
      markNotificationRead,
      markAllNotificationsRead,
      logSavingsToGoal,
    ],
  );
}
