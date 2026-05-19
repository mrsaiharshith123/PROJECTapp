import { describe, it, expect } from "vitest";
import {
  computeContractPaymentLedger,
  reconcileBillAfterEdit,
} from "../billPaymentProgress.js";
import { getEffectiveStatus } from "../commitmentStatus.js";
import { isHistoryBill, isActiveBill } from "../billLifecycle.js";
import { normalizeCommitment } from "../migrateStorage.js";

describe("reconcileBillAfterEdit", () => {
  it("reopens EMI when end date is extended into the future", () => {
    const prev = {
      id: 1,
      name: "Home loan",
      amount: 10000,
      remainingAmount: 0,
      repeatType: "monthly",
      startDate: "2024-01-01",
      endDate: "2025-12-01",
      dueDate: "2025-12-01",
      status: "paid",
      payments: Array.from({ length: 20 }, (_, i) => ({
        amount: 10000,
        date: `2024-${String(i + 2).padStart(2, "0")}-01`,
      })),
    };
    const next = { ...prev, endDate: "2027-12-01" };
    const reopened = reconcileBillAfterEdit(prev, next, "2026-05-01", [prev]);
    expect(reopened.remainingAmount).toBeGreaterThan(0);
    expect(reopened.status).toBe("pending");
    const saved = normalizeCommitment(reopened);
    expect(saved.remainingAmount).toBeGreaterThan(0);
    expect(isActiveBill(saved, getEffectiveStatus, "2026-05-01")).toBe(true);
    expect(isHistoryBill(saved, getEffectiveStatus, "2026-05-01")).toBe(false);
  });
});

describe("computeContractPaymentLedger", () => {
  it("shows paid vs remaining installments from recorded payments", () => {
    const c = {
      name: "EMI",
      amount: 5000,
      repeatType: "monthly",
      startDate: "2025-01-01",
      endDate: "2025-05-01",
      dueDate: "2025-01-10",
      remainingAmount: 15000,
      payments: [
        { amount: 5000, date: "2025-01-12" },
        { amount: 5000, date: "2025-02-10" },
      ],
    };
    const p = computeContractPaymentLedger(c, "2025-03-15", [c]);
    expect(p.totalCycles).toBe(5);
    expect(p.paidCycles).toBe(2);
    expect(p.remainingCycles).toBe(3);
    expect(p.paidTillNow).toBe(10000);
    expect(p.remainingToPay).toBe(15000);
    expect(p.totalContractValue).toBe(25000);
    expect(p.label).toContain("2 of 5");
  });

  it("counts installments from start date before first tracked payment", () => {
    const c = {
      name: "Car loan",
      amount: 10000,
      repeatType: "monthly",
      startDate: "2023-01-01",
      endDate: "2026-12-01",
      dueDate: "2026-05-01",
      remainingAmount: 20000,
      payments: [{ amount: 10000, date: "2026-05-01" }],
    };
    const p = computeContractPaymentLedger(c, "2026-05-19", [c]);
    expect(p.paidCycles).toBeGreaterThan(20);
    expect(p.paymentEntries).toBe(1);
    expect(p.inferredPriorSpend).toBeGreaterThan(10000);
    expect(p.paidTillNow).toBeGreaterThan(p.paymentAmount);
  });

  it("assumes elapsed installments paid when no payments logged yet", () => {
    const c = {
      name: "Rent",
      amount: 20000,
      repeatType: "monthly",
      startDate: "2024-06-01",
      endDate: "2025-12-01",
      dueDate: "2025-06-01",
      payments: [],
    };
    const p = computeContractPaymentLedger(c, "2025-03-15", [c]);
    expect(p.paidCycles).toBeGreaterThan(0);
    expect(p.paidTillNow).toBeGreaterThan(0);
    expect(p.remainingToPay).toBeLessThan(p.totalContractValue);
  });
});
