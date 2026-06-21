import { describe, it, expect } from "vitest";
import { getEffectiveStatus } from "../../src/utils/commitmentStatus.js";
import { isActiveBill } from "../../src/utils/billLifecycle.js";
import { canEditLending, canDeleteLending, isAgreementFullyLocked } from "../../src/engines/lendingAgreement.js";
import { TODAY, LENDING } from "../fixtures.mjs";

describe("STATE MACHINE: commitment status transitions", () => {
  const paid = { id: "1", amount: 5000, status: "paid", dueDate: "2026-06-01", repeatType: "none", remainingAmount: 0 };
  const pending = { id: "2", amount: 5000, status: "pending", dueDate: "2026-07-01", repeatType: "monthly", remainingAmount: 5000 };
  const overdue = { id: "3", amount: 5000, status: "pending", dueDate: "2026-05-01", repeatType: "monthly", remainingAmount: 5000 };

  it("[P1] paid commitment reports status=paid", () => {
    expect(getEffectiveStatus(paid, TODAY)).toBe("paid");
  });

  it("[P1] future-due pending commitment reports pending or upnext", () => {
    const status = getEffectiveStatus(pending, TODAY);
    expect(["pending", "upnext"]).toContain(status);
  });

  it("[P1] past-due pending commitment reports overdue", () => {
    expect(getEffectiveStatus(overdue, TODAY)).toBe("overdue");
  });

  it("[P1] paid one-time commitment is NOT an active bill", () => {
    expect(isActiveBill(paid, (c, t) => getEffectiveStatus(c, t), TODAY)).toBe(false);
  });

  it("[P1] pending commitment IS an active bill", () => {
    expect(isActiveBill(pending, (c, t) => getEffectiveStatus(c, t), TODAY)).toBe(true);
  });
});

describe("STATE MACHINE: lending agreement transitions", () => {
  it("[P1] unsigned lending CAN be edited", () => {
    expect(canEditLending(LENDING.normal)).toBe(true);
  });

  it("[P1] unsigned lending CAN be deleted", () => {
    expect(canDeleteLending(LENDING.normal)).toBe(true);
  });

  it("[P0] signed/locked lending CANNOT be edited", () => {
    expect(canEditLending(LENDING.locked)).toBe(false);
  });

  it("[P0] signed/locked lending CANNOT be deleted", () => {
    expect(canDeleteLending(LENDING.locked)).toBe(false);
  });

  it("[P0] agreement with esignStatus=completed IS fully locked", () => {
    expect(isAgreementFullyLocked(LENDING.locked)).toBe(true);
  });

  it("[P1] agreement without esign is NOT locked", () => {
    expect(isAgreementFullyLocked(LENDING.normal)).toBe(false);
  });

  it("[P2] zero-principal lending is not locked", () => {
    expect(isAgreementFullyLocked(LENDING.zero)).toBe(false);
  });
});
