import { describe, it, expect } from "vitest";
import { normalizeCommitment } from "../../src/utils/migrateStorage.js";
import { canUseCloudSync } from "../../src/services/sync/syncEngine.js";
import { isRazorpayConfigured } from "../../src/services/razorpayConfig.js";
import { invokeEdgeFunction } from "../../src/services/supabase/invokeEdgeFunction.js";
import { SETTINGS } from "../fixtures.mjs";
import fs from "fs";
import path from "path";

describe("SMOKE: critical user flows (static)", () => {
  it("[P0] normalizeCommitment produces a bill with due date and category", () => {
    const c = normalizeCommitment({
      name: "Rent",
      amount: 15000,
      category: "Rent",
      dueDate: "2026-04-01",
      repeatType: "monthly",
    });
    expect(c.name).toBe("Rent");
    expect(c.amount).toBe(15000);
    expect(c.category).toBe("Rent");
    expect(c.dueDate).toBe("2026-04-01");
    expect(c.repeatType).toBe("monthly");
  });

  it("[P0] cloud backup toggle requires Pro tier + auth (canUseCloudSync)", () => {
    expect(canUseCloudSync(SETTINGS.free, true, "free")).toBe(false);
    expect(canUseCloudSync({ ...SETTINGS.pro, cloudSyncEnabled: true }, true, "pro")).toBe(true);
    expect(canUseCloudSync({ ...SETTINGS.pro, cloudSyncEnabled: true }, false, "pro")).toBe(false);
  });

  it("[P1] razorpay checkout module exports configuration guard", () => {
    expect(typeof isRazorpayConfigured).toBe("function");
  });

  it("[P1] invokeEdgeFunction module exports retry-aware wrapper", () => {
    expect(typeof invokeEdgeFunction).toBe("function");
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/services/supabase/invokeEdgeFunction.js"),
      "utf8",
    );
    expect(src).toMatch(/timeoutMs|retries|AbortController/);
  });

  it("[P1] AuthGatePage exists for sign-in smoke path", () => {
    const p = path.join(process.cwd(), "src/ui/features/auth/AuthGatePage.jsx");
    expect(fs.existsSync(p)).toBe(true);
    const src = fs.readFileSync(p, "utf8");
    expect(src).toMatch(/useTranslation/);
    expect(src).toMatch(/signIn|signUp|auth\./i);
  });

  it("[P1] home + insights editorial CSS classes present after split", () => {
    const editorial = fs.readFileSync(
      path.join(process.cwd(), "src/ui/styles/components-editorial.css"),
      "utf8",
    );
    expect(editorial).toMatch(/ed-insights-page|ed-home|financial-pulse/i);
  });

  it("[P2] pay-verify path uses invokeEdgeFunction in razorpaySubscription", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/services/razorpaySubscription.js"),
      "utf8",
    );
    expect(src).toMatch(/invokeEdgeFunction/);
    expect(src).not.toMatch(/supabase\.functions\.invoke/);
  });
});
