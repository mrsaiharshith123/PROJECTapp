import { describe, expect, it } from "vitest";
import { maskEmail, sanitizeMeta } from "../logger.js";

describe("logger", () => {
  it("masks email in meta", () => {
    expect(maskEmail("harsha@example.com")).toBe("ha***@example.com");
  });

  it("redacts passwords in meta", () => {
    const out = sanitizeMeta({ email: "a@b.co", password: "secret" });
    expect(out.password).toBe("[redacted]");
    expect(String(out.email)).not.toBe("a@b.co");
  });
});
