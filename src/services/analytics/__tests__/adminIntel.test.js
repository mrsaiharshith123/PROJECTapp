import { describe, expect, it } from "vitest";
import { isAdminProfile } from "../adminIntel.js";

describe("isAdminProfile", () => {
  it("returns true only when is_admin is true", () => {
    expect(isAdminProfile({ is_admin: true })).toBe(true);
    expect(isAdminProfile({ is_admin: false })).toBe(false);
    expect(isAdminProfile(null)).toBe(false);
    expect(isAdminProfile({})).toBe(false);
  });
});
