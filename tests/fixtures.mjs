// ─── Shared test fixtures ────────────────────────────────────
export const INCOME = {
  zero: 0,
  minimal: 5000,
  average: 50000,
  high: 200000,
  huge: 99999999,
};

export const STATUS = {
  paid: () => "paid",
  pending: () => "pending",
  overdue: () => "overdue",
};

export const COMMITMENT = {
  normal: { id: "c1", amount: 10000, remainingAmount: 10000, repeatType: "monthly", category: "EMI", dueDate: "2026-07-05" },
  zero: { id: "c2", amount: 0, remainingAmount: 0, repeatType: "monthly", category: "Utility" },
  negative: { id: "c3", amount: -5000, remainingAmount: -5000, repeatType: "monthly", category: "EMI" },
  huge: { id: "c4", amount: 99999999, remainingAmount: 99999999, repeatType: "monthly", category: "Rent" },
  decimal: { id: "c5", amount: 18333.33, remainingAmount: 18333.33, repeatType: "monthly", category: "EMI" },
  noAmount: { id: "c6", repeatType: "monthly", category: "Utility" },
  noId: { amount: 5000, repeatType: "monthly", category: "EMI" },
};

export const LENDING = {
  normal: {
    id: "l1",
    principalAmount: 50000,
    interestRate: 12,
    type: "lent",
    personName: "Rahul Sharma",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    remainingAmount: 25000,
    status: "active",
  },
  zero: { id: "l2", principalAmount: 0, interestRate: 0, type: "lent", personName: "Test", remainingAmount: 0 },
  locked: {
    id: "l3",
    principalAmount: 30000,
    interestRate: 8,
    type: "lent",
    esignStatus: "completed",
    agreementHash: "abc123",
    agreementLocked: true,
    agreementAccepted: true,
    remainingAmount: 15000,
    status: "active",
  },
  longName: { id: "l4", principalAmount: 10000, type: "lent", personName: "A".repeat(500), remainingAmount: 10000 },
  specialChars: { id: "l5", principalAmount: 10000, type: "lent", personName: "O'Brien & Co \"Test\"", remainingAmount: 10000 },
  sqlInjection: { id: "l6", principalAmount: 10000, type: "lent", personName: "'; DROP TABLE lendings; --", remainingAmount: 10000 },
};

export const SETTINGS = {
  free: { subscriptionTier: "free", monthlyIncome: 50000, salaryCreditDay: 5 },
  pro: { subscriptionTier: "pro", monthlyIncome: 50000, salaryCreditDay: 5 },
  power: { subscriptionTier: "power", monthlyIncome: 50000, salaryCreditDay: 5 },
  noIncome: { subscriptionTier: "free", monthlyIncome: 0 },
  noSalaryDay: { subscriptionTier: "free", monthlyIncome: 50000 },
  badTier: { subscriptionTier: "platinum", monthlyIncome: 50000 },
};

export const TODAY = "2026-06-21";

export function makeCommitments(n, overrideAmount = 10000) {
  return Array.from({ length: n }, (_, i) => ({
    id: `bulk-${i}`,
    amount: overrideAmount,
    remainingAmount: overrideAmount,
    repeatType: "monthly",
    category: "EMI",
    dueDate: "2026-07-15",
  }));
}

export function makeLendings(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `l-${i}`,
    remainingAmount: 1000,
    status: "active",
    type: "lent",
  }));
}

export function makeChits(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `chit-${i}`,
    category: "Chit Fund",
    repeatType: "monthly",
    amount: 5000,
    remainingAmount: 5000,
    dueDate: "2026-07-01",
  }));
}

export function makeGoals(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `g-${i}`,
    active: true,
    archived: false,
  }));
}
