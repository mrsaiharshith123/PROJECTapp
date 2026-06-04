import { describe, expect, it } from "vitest";
import { formatAuthError } from "../authErrors.js";

describe("formatAuthError", () => {
  it("maps invalid credentials", () => {
    expect(formatAuthError({ message: "Invalid login credentials" })).toMatch(/incorrect/i);
  });

  it("maps network errors", () => {
    expect(formatAuthError(new Error("Failed to fetch"))).toMatch(/network/i);
  });
});
