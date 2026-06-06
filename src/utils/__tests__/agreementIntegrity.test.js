import { describe, expect, it } from "vitest";
import { hashText, verifyAgreement } from "../agreementExport.js";

describe("agreementIntegrity", () => {
  it("same text always produces same hash", async () => {
    const a = await hashText("hello agreement");
    const b = await hashText("hello agreement");
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("different text produces different hash", async () => {
    const a = await hashText("text one");
    const b = await hashText("text two");
    expect(a).not.toBe(b);
  });

  it("verifyAgreement returns true for matching pair", async () => {
    const text = "PROMISSORY NOTE sample";
    const hash = await hashText(text);
    expect(await verifyAgreement(text, hash)).toBe(true);
  });

  it("verifyAgreement returns false for tampered text", async () => {
    const hash = await hashText("original");
    expect(await verifyAgreement("tampered", hash)).toBe(false);
  });
});
