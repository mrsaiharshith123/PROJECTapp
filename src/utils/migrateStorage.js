import { inferPriorityFromCategory } from "../constants/priority.js";
import { CATEGORIES } from "../constants/categories.js";
import {
  USER_MODE_IDS,
  REMOVED_USER_MODE_IDS,
} from "../constants/userModes.js";
import { enrichLendingFinancials } from "./lendingFinancials.js";
import { computeContractPaymentLedger } from "./billPaymentProgress.js";
import { currentCycleRemainingAmount } from "./commitmentPayments.js";
import { todayYmd } from "./dates.js";
import { refreshAllChitCommitments } from "./chitSync.js";
import { normalizeRepeatType } from "../constants/repeatTypes.js";
import { normalizePremiumFrequency } from "../constants/insurance.js";
import { normalizeDashboardToolOrderByMode } from "./dashboardToolOrder.js";
import { STORAGE_KEYS } from "../storage/keys.js";
import { CONSENT_KEY } from "./dpdpConsent.js";
import { emitLocalDataChanged, emitSettingsReset } from "../storage/events.js";

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

export const SCHEMA_VERSION_KEY = "committrack_schema_version";
export const CURRENT_SCHEMA_VERSION = 9;

function normalizeCategory(raw) {
  const s = String(raw || "").trim();
  if (s === "Health") return "Insurance";
  if (CATEGORY_IDS.has(s)) return s;
  return "Other";
}

/**
 * @param {object} raw
 * @returns {object}
 */
export function normalizeCommitment(raw) {
  const now = Date.now();
  const amount = Math.max(0, Number(raw.amount) || 0);
  const payments = Array.isArray(raw.payments)
    ? raw.payments.map((p) => ({
        amount: Math.max(0, Number(p.amount) || 0),
        date: String(p.date || "").slice(0, 10),
      }))
    : [];
  const category = normalizeCategory(raw.category);
  const repeatType = normalizeRepeatType(raw.repeatType);
  const priority = ["critical", "medium", "low"].includes(raw.priority)
    ? raw.priority
    : inferPriorityFromCategory(category);
  const paidSum = payments.reduce((s, p) => s + p.amount, 0);

  const dueDate = String(raw.dueDate || raw.startDate || "").slice(0, 10);
  const startDate = String(raw.startDate || raw.dueDate || "").slice(0, 10);
  const endDate = raw.endDate ? String(raw.endDate).slice(0, 10) : "";
  const draft = {
    ...raw,
    startDate,
    dueDate,
    endDate,
    repeatType,
    amount,
    category,
    payments,
  };
  const ledger = computeContractPaymentLedger(draft, todayYmd());
  let remainingAmount;
  if (repeatType === "none") {
    remainingAmount = Math.max(0, amount - paidSum);
    if (raw.status === "paid") remainingAmount = 0;
  } else {
    remainingAmount = currentCycleRemainingAmount(draft, todayYmd());
    if (remainingAmount <= 0 && raw.status !== "paid") {
      remainingAmount = amount;
    }
  }

  const priorSpend =
    raw.priorSpend != null && !Number.isNaN(Number(raw.priorSpend))
      ? Math.max(0, Number(raw.priorSpend))
      : Math.max(0, ledger.inferredPriorSpend ?? 0);

  return {
    id: raw.id,
    name: String(raw.name || "").trim() || "Untitled",
    amount,
    remainingAmount,
    category,
    startDate,
    endDate,
    dueDate,
    repeatType,
    priority,
    status: ["paid", "pending", "overdue", "upnext"].includes(raw.status) ? raw.status : "pending",
    payments,
    notes: String(raw.notes ?? ""),
    profileId: String(raw.profileId || "default"),
    annualInterestRate:
      raw.annualInterestRate != null && !Number.isNaN(Number(raw.annualInterestRate))
        ? Math.min(60, Math.max(0, Number(raw.annualInterestRate)))
        : null,
    trialEnd: raw.trialEnd ? String(raw.trialEnd).slice(0, 10) : "",
    priorSpend,
    insurancePolicyId: String(raw.insurancePolicyId || "").trim(),
    insuredPersonName: String(raw.insuredPersonName || "").trim(),
    insuranceCompany: String(raw.insuranceCompany || "").trim(),
    insuranceSumAssured:
      raw.insuranceSumAssured != null && !Number.isNaN(Number(raw.insuranceSumAssured))
        ? Math.max(0, Number(raw.insuranceSumAssured))
        : null,
    insuranceTermYears:
      raw.insuranceTermYears != null && !Number.isNaN(Number(raw.insuranceTermYears))
        ? Math.max(1, Math.floor(Number(raw.insuranceTermYears)))
        : null,
    insurancePremiumFrequency:
      category === "Insurance" ? normalizePremiumFrequency(raw.insurancePremiumFrequency) : "",
    insuranceMaturityBenefit:
      raw.insuranceMaturityBenefit != null && !Number.isNaN(Number(raw.insuranceMaturityBenefit))
        ? Math.max(0, Number(raw.insuranceMaturityBenefit))
        : null,
    chitValue:
      category === "Chit Fund" && raw.chitValue != null && !Number.isNaN(Number(raw.chitValue))
        ? Math.max(0, Number(raw.chitValue))
        : null,
    chitMonths:
      category === "Chit Fund" && raw.chitMonths != null
        ? Math.max(1, Math.floor(Number(raw.chitMonths)))
        : null,
    chitCurrentMonth:
      category === "Chit Fund" && raw.chitCurrentMonth != null
        ? Math.max(1, Math.floor(Number(raw.chitCurrentMonth)))
        : null,
    chitForemanPct:
      category === "Chit Fund" && raw.chitForemanPct != null
        ? Math.min(15, Math.max(0, Number(raw.chitForemanPct)))
        : null,
    chitTaken: category === "Chit Fund" ? Boolean(raw.chitTaken) : false,
    chitTakenAtMonth:
      category === "Chit Fund" && raw.chitTakenAtMonth != null
        ? Math.max(1, Math.floor(Number(raw.chitTakenAtMonth)))
        : null,
    chitTakenDiscount:
      category === "Chit Fund" && raw.chitTakenDiscount != null
        ? Math.max(0, Number(raw.chitTakenDiscount))
        : null,
    chitMonthsPaid:
      category === "Chit Fund" && raw.chitMonthsPaid != null
        ? Math.max(0, Math.floor(Number(raw.chitMonthsPaid)))
        : null,
    chitInstallmentMode:
      category === "Chit Fund" && raw.chitInstallmentMode
        ? String(raw.chitInstallmentMode)
        : "equal",
    chitCustomInstallment:
      category === "Chit Fund" && raw.chitCustomInstallment != null
        ? Math.max(0, Number(raw.chitCustomInstallment))
        : null,
    chitTakenPayout:
      category === "Chit Fund" && raw.chitTakenPayout != null
        ? Math.max(0, Number(raw.chitTakenPayout))
        : null,
    householdPayer: ["primary", "secondary", "shared"].includes(String(raw.householdPayer || "").toLowerCase())
      ? String(raw.householdPayer).toLowerCase()
      : "",
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
  };
}

/**
 * @param {object} raw
 */
export function normalizeLending(raw) {
  const now = Date.now();
  const totalAmount = Math.max(0, Number(raw.totalAmount ?? raw.amount) || 0);
  const payments = Array.isArray(raw.payments)
    ? raw.payments.map((p) => ({
        amount: Math.max(0, Number(p.amount) || 0),
        date: String(p.date || "").slice(0, 10),
        onTime: p.onTime === false ? false : true,
      }))
    : [];
  const paidSum = payments.reduce((s, p) => s + p.amount, 0);
  const remainingAmount = Math.max(0, totalAmount - paidSum);
  const type = raw.type === "borrowed" ? "borrowed" : "lent";
  let status = raw.status;
  if (remainingAmount <= 0) {
    status = "complete";
  } else if (status === "complete") {
    status = "pending";
  }
  if (!["pending", "overdue", "complete"].includes(status)) {
    status = "pending";
  }

  const base = {
    id: raw.id,
    personName: String(raw.personName ?? raw.name ?? "").trim() || "Unknown",
    type,
    totalAmount,
    remainingAmount,
    dueDate: String(raw.dueDate || "").slice(0, 10),
    payments: payments.map((p) => ({
      ...p,
      principalPortion: Number(p.principalPortion) || 0,
      interestPortion: Number(p.interestPortion) || 0,
      paymentType: p.paymentType || "partial",
    })),
    notes: String(raw.notes ?? raw.note ?? ""),
    status,
    proofs: Array.isArray(raw.proofs)
      ? raw.proofs.map((p) => ({
          type: p.type === "document" ? "document" : "image",
          uri: String(p.uri || ""),
          date: String(p.date || "").slice(0, 10),
          label: String(p.label || ""),
        }))
      : [],
    disputeStatus: ["none", "open", "resolved"].includes(raw.disputeStatus) ? raw.disputeStatus : "none",
    agreementText: String(raw.agreementText ?? ""),
    agreementAccepted: Boolean(raw.agreementAccepted),
    agreementAcceptedAt: raw.agreementAcceptedAt ? Number(raw.agreementAcceptedAt) : null,
    agreementLocked: Boolean(raw.agreementLocked),
    offerId: raw.offerId ? String(raw.offerId) : null,
    borrowerSignName: String(raw.borrowerSignName ?? ""),
    borrowerSignedAt: raw.borrowerSignedAt ? Number(raw.borrowerSignedAt) : null,
    lenderSignName: String(raw.lenderSignName ?? ""),
    lenderSignedAt: raw.lenderSignedAt ? Number(raw.lenderSignedAt) : null,
    collateralDescription: String(raw.collateralDescription ?? ""),
    mutualCancelBorrowerSign: String(raw.mutualCancelBorrowerSign ?? ""),
    mutualCancelLenderSign: String(raw.mutualCancelLenderSign ?? ""),
    relationshipTag: ["Friend", "Family", "Business", "Other"].includes(raw.relationshipTag)
      ? raw.relationshipTag
      : "Other",
    profileId: String(raw.profileId || "default"),
    paymentTimeline: Array.isArray(raw.paymentTimeline) ? raw.paymentTimeline : [],
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
    principalAmount: Math.max(0, Number(raw.principalAmount ?? raw.totalAmount) || 0),
    interestRate: Math.max(0, Math.min(60, Number(raw.interestRate) || 0)),
    interestType: raw.interestType || "simple",
    startDate: String(raw.startDate || raw.dueDate || "").slice(0, 10),
    endDate: String(raw.endDate || raw.dueDate || "").slice(0, 10),
    repaymentType: raw.repaymentType || "monthly",
    repaymentFrequency: raw.repaymentFrequency || "monthly",
    repaymentSchedule: Array.isArray(raw.repaymentSchedule) ? raw.repaymentSchedule : [],
  };

  const financials = enrichLendingFinancials(base, "");
  const trustScoreSnapshot =
    typeof raw.trustScoreSnapshot === "number" ? raw.trustScoreSnapshot : null;

  return {
    ...base,
    ...financials,
    trustScoreSnapshot,
    status: financials.remainingBalance <= 0 ? "complete" : status === "complete" && financials.remainingBalance > 0 ? "pending" : status,
    remainingAmount: financials.remainingBalance,
  };
}

function mapNormalized(items, normalizer) {
  const out = [];
  for (const item of items) {
    try {
      out.push(normalizer(item));
    } catch {
      /* skip corrupt row */
    }
  }
  return out;
}

export function loadCommitmentsFromStorage() {
  try {
    const raw = localStorage.getItem("commitments");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const normalized = mapNormalized(arr, normalizeCommitment);
        const todayStr = todayYmd();
        const synced = refreshAllChitCommitments(normalized, todayStr);
        const changed = synced.some(
          (c, i) =>
            c.chitCurrentMonth !== normalized[i]?.chitCurrentMonth ||
            c.amount !== normalized[i]?.amount ||
            c.remainingAmount !== normalized[i]?.remainingAmount
        );
        if (changed) {
          try {
            localStorage.setItem("commitments", JSON.stringify(synced));
          } catch {
            /* ignore */
          }
        }
        return synced;
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function loadLendingsFromStorage() {
  try {
    const raw = localStorage.getItem("lendings");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return mapNormalized(arr, normalizeLending);
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function loadMonthlySnapshotsFromStorage() {
  try {
    const raw = localStorage.getItem("committrack_monthly_snapshots");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr.filter((s) => s && typeof s.month === "string").slice(-48);
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveMonthlySnapshotsToStorage(snapshots) {
  try {
    localStorage.setItem("committrack_monthly_snapshots", JSON.stringify(snapshots.slice(-48)));
  } catch {
    /* ignore */
  }
}

export function normalizeGoal(raw) {
  const now = Date.now();
  const type = ["reduce_open_debt", "income_ratio_cap", "save_amount", "education", "wedding"].includes(raw.type)
    ? raw.type
    : "reduce_open_debt";
  return {
    id: raw.id ?? Date.now(),
    type,
    title: String(raw.title || "Goal").trim(),
    profileId: String(raw.profileId || "default"),
    active: raw.active !== false,
    archived: Boolean(raw.archived),
    baselineOpenRemaining: Number(raw.baselineOpenRemaining) || 0,
    targetReduction: Math.max(1, Number(raw.targetReduction) || 1),
    targetRatio: Math.min(0.95, Math.max(0.05, Number(raw.targetRatio) || 0.5)),
    targetAmount: Math.max(0, Number(raw.targetAmount) || 0),
    savedAmount: Math.max(0, Number(raw.savedAmount) || 0),
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
  };
}

export function loadGoalsFromStorage() {
  try {
    const raw = localStorage.getItem("committrack_goals");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return mapNormalized(arr, normalizeGoal);
    }
  } catch {
    /* ignore */
  }
  return [];
}

/** One-time: move deprecated settings.savedTowardGoals onto the first save_amount goal. */
export function migrateLegacySavedTowardGoals(settings, goals) {
  const legacy = Math.max(0, Number(settings?.savedTowardGoals) || 0);
  if (legacy <= 0) return { settings, goals };

  const saveGoal = (goals || []).find((g) => g.type === "save_amount");
  if (!saveGoal) return { settings, goals };

  const nextGoals = goals.map((g) =>
    g.id !== saveGoal.id
      ? g
      : normalizeGoal({
          ...g,
          savedAmount: Math.max(0, Number(g.savedAmount) || 0) + legacy,
          updatedAt: Date.now(),
        })
  );
  const nextSettings = { ...settings, savedTowardGoals: 0 };

  try {
    saveGoalsToStorage(nextGoals);
    localStorage.setItem("committrack_settings", JSON.stringify(nextSettings));
  } catch {
    /* ignore */
  }

  return { settings: nextSettings, goals: nextGoals };
}

let cachedInitialAppState;

export function invalidateInitialAppStateCache() {
  cachedInitialAppState = undefined;
}

export function loadInitialAppState() {
  if (cachedInitialAppState) return cachedInitialAppState;
  const settings = loadSettingsFromStorage();
  const goals = loadGoalsFromStorage();
  const migrated = migrateLegacySavedTowardGoals(settings, goals);
  cachedInitialAppState = {
    commitments: loadCommitmentsFromStorage(),
    lendings: loadLendingsFromStorage(),
    settings: migrated.settings,
    goals: migrated.goals,
    monthlySnapshots: loadMonthlySnapshotsFromStorage(),
  };
  return cachedInitialAppState;
}

/** Fresh read for cloud sync / export (bypasses in-memory cache). */
export function loadFullAppStateForSync() {
  invalidateInitialAppStateCache();
  return loadInitialAppState();
}

export function saveGoalsToStorage(goals) {
  try {
    localStorage.setItem("committrack_goals", JSON.stringify(goals));
  } catch {
    /* ignore */
  }
}

const COLOR_SCHEMES = ["light", "dark", "system"];

const PROFILE_COLORS = ["indigo", "violet", "emerald", "amber", "rose", "sky"];

export function normalizeProfiles(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [{ id: "default", label: "Personal", color: "indigo" }];
  }
  const out = raw
    .map((p, i) => ({
      id: String(p?.id || `profile-${i}`).slice(0, 40),
      label: String(p?.label || p?.id || "Profile").slice(0, 40),
      color: PROFILE_COLORS.includes(p?.color) ? p.color : PROFILE_COLORS[i % PROFILE_COLORS.length],
    }))
    .filter((p) => p.id);
  if (!out.some((p) => p.id === "default")) {
    out.unshift({ id: "default", label: "Personal", color: "indigo" });
  }
  return out;
}

const DEFAULT_SETTINGS = {
  monthlyIncome: 0,
  secondaryMonthlyIncome: 0,
  /** "take_home" = what hits your account; "gross" = before tax — same math, clearer copy. */
  incomeEntryBasis: "take_home",
  displayName: "",
  phoneNumber: "",
  userMode: "salaried",
  /** "single" | "family" — only when userMode is salaried */
  householdScope: "single",
  /** "free" | "power" — subscription unlocks power features */
  subscriptionTier: "free",
  onboardingComplete: false,
  appGuideComplete: false,
  savedTowardGoals: 0,
  readNotificationIds: [],
  activeProfileId: "default",
  colorScheme: "system",
  avatarSource: "auto",
  profileImageDataUrl: "",
  liquidSavings: 0,
  dependents: 0,
  profiles: [{ id: "default", label: "Personal", color: "indigo" }],
  remindersEnabled: true,
  dashboardToolOrderByMode: {},
  /** Legacy flag — backup is on whenever signed in + Supabase configured. */
  cloudSyncEnabled: false,
  /** Day of month (1–31) salary credits — used by paycheck flow when UI is wired. */
  salaryCreditDay: null,
};

export function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem("committrack_settings");
    if (raw) {
      const o = JSON.parse(raw);
      if (!o || typeof o !== "object" || Array.isArray(o)) {
        return { ...DEFAULT_SETTINGS };
      }
      let mode = USER_MODE_IDS.includes(o.userMode) ? o.userMode : "salaried";
      let householdScope = o.householdScope === "family" ? "family" : "single";
      let subscriptionTier = "free";
      if (o.subscriptionTier === "power") subscriptionTier = "power";
      else if (o.subscriptionTier === "pro") subscriptionTier = "pro";
      if (mode === "family") {
        mode = "salaried";
        householdScope = "family";
      }
      if (mode === "power") {
        mode = "salaried";
        subscriptionTier = "power";
      }
      if (REMOVED_USER_MODE_IDS.includes(mode)) {
        mode = "salaried";
      }
      if (!USER_MODE_IDS.includes(mode)) {
        mode = "salaried";
      }
      return {
        monthlyIncome: Math.max(0, Number(o.monthlyIncome) || 0),
        secondaryMonthlyIncome: Math.max(0, Number(o.secondaryMonthlyIncome) || 0),
        incomeEntryBasis: o.incomeEntryBasis === "gross" ? "gross" : "take_home",
        displayName: String(o.displayName || ""),
        phoneNumber: String(o.phoneNumber || ""),
        userMode: mode,
        householdScope,
        subscriptionTier,
        onboardingComplete: "onboardingComplete" in o ? Boolean(o.onboardingComplete) : false,
        appGuideComplete:
          "appGuideComplete" in o
            ? Boolean(o.appGuideComplete)
            : Boolean(o.onboardingComplete),
        savedTowardGoals: Math.max(0, Number(o.savedTowardGoals) || 0),
        readNotificationIds: Array.isArray(o.readNotificationIds)
          ? o.readNotificationIds.map(String)
          : [],
        activeProfileId: String(o.activeProfileId || "default"),
        colorScheme: COLOR_SCHEMES.includes(o.colorScheme) ? o.colorScheme : "system",
        avatarSource: o.avatarSource === "upload" ? "upload" : "auto",
        profileImageDataUrl:
          o.avatarSource === "upload" && typeof o.profileImageDataUrl === "string"
            ? o.profileImageDataUrl
            : "",
        liquidSavings: Math.max(0, Number(o.liquidSavings) || 0),
        dependents: Math.max(0, Math.min(12, Math.floor(Number(o.dependents) || 0))),
        profiles: normalizeProfiles(o.profiles),
        remindersEnabled: "remindersEnabled" in o ? Boolean(o.remindersEnabled) : true,
        dashboardToolOrderByMode: normalizeDashboardToolOrderByMode(o.dashboardToolOrderByMode),
        cloudSyncEnabled: Boolean(o.cloudSyncEnabled),
        salaryCreditDay:
          o.salaryCreditDay != null && o.salaryCreditDay !== ""
            ? Math.min(31, Math.max(1, Math.floor(Number(o.salaryCreditDay) || 0)))
            : null,
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_SETTINGS };
}

/** Wipes all device-local CommitTrack data (DPDP erasure). Does not sign out. */
export function clearAllLocalData() {
  try {
    localStorage.removeItem(STORAGE_KEYS.commitments);
    localStorage.removeItem(STORAGE_KEYS.lendings);
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.monthlySnapshots);
    localStorage.removeItem(STORAGE_KEYS.goals);
    localStorage.removeItem(STORAGE_KEYS.syncMeta);
    localStorage.removeItem(CONSENT_KEY);
    localStorage.setItem(STORAGE_KEYS.schemaVersion, String(CURRENT_SCHEMA_VERSION));
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key?.startsWith("committrack_auth_seeded_") ||
        key?.startsWith("committrack_profile_seeded_")
      ) {
        localStorage.removeItem(key);
      }
    }
    invalidateInitialAppStateCache();
    emitLocalDataChanged();
    emitSettingsReset();
  } catch {
    /* ignore */
  }
}
