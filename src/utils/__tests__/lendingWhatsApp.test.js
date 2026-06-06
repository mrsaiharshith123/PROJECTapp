import { describe, expect, it } from "vitest";
import {
  buildReminderMessage,
  buildFinalNoticeMessage,
  buildWhatsAppLink,
} from "../lendingWhatsApp.js";

describe("lendingWhatsApp", () => {
  const lending = {
    type: "lent",
    personName: "Ravi",
    borrowerFullName: "Ravi Kumar",
    principalAmount: 25000,
    remainingAmount: 20000,
    nextDueAmount: 5000,
    dueDate: "2026-06-01",
    startDate: "2026-01-01",
  };
  const settings = { displayName: "Harsha" };

  it("buildWhatsAppLink strips non-digits from phone", () => {
    expect(buildWhatsAppLink("+91 98765-43210", "hi")).toContain("919876543210");
  });

  it("buildWhatsAppLink prepends 91 to 10-digit number", () => {
    expect(buildWhatsAppLink("9876543210", "test")).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
  });

  it("buildReminderMessage is under 350 characters", () => {
    expect(buildReminderMessage(lending, settings).length).toBeLessThan(350);
  });

  it("buildReminderMessage contains borrower name", () => {
    expect(buildReminderMessage(lending, settings)).toContain("Ravi Kumar");
  });

  it("buildFinalNoticeMessage contains legal", () => {
    expect(buildFinalNoticeMessage(lending, settings).toLowerCase()).toContain("legal");
  });
});
