import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "../auth.js";

describe("normalizeSupabaseUrl", () => {
  it("passes through full https URL", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/")).toBe("https://abc.supabase.co");
  });

  it("builds URL from project ref", () => {
    expect(normalizeSupabaseUrl("zorusrquumnboekqcici")).toBe("https://zorusrquumnboekqcici.supabase.co");
  });

  it("returns empty for blank", () => {
    expect(normalizeSupabaseUrl("")).toBe("");
  });
});
