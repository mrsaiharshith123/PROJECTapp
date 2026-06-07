import { describe, expect, it } from "vitest";
import { normalizeAppLanguage, ALL_APP_LANGUAGES, isRtlLanguage } from "../languages.js";
import { translate, listMessageKeys, enMessages } from "../translate.js";

describe("i18n languages", () => {
  it("includes English plus 22 scheduled Indian languages", () => {
    expect(ALL_APP_LANGUAGES).toHaveLength(23);
    expect(ALL_APP_LANGUAGES[0].code).toBe("en");
  });

  it("normalizes invalid codes to English", () => {
    expect(normalizeAppLanguage("hi")).toBe("hi");
    expect(normalizeAppLanguage("xx")).toBe("en");
    expect(normalizeAppLanguage("")).toBe("en");
  });

  it("marks Urdu as RTL", () => {
    expect(isRtlLanguage("ur")).toBe(true);
    expect(isRtlLanguage("hi")).toBe(false);
  });
});

describe("translate", () => {
  it("interpolates params", () => {
    expect(translate(enMessages, "home.welcome", { name: "Asha" })).toBe("Welcome, Asha");
  });

  it("falls back to English for unknown keys", () => {
    expect(translate({ "home.welcome": "Hi {name}" }, "missing.key", {})).toBe("missing.key");
  });

  it("lists stable message keys from English source", () => {
    const keys = listMessageKeys();
    expect(keys.length).toBeGreaterThan(50);
    expect(keys).toContain("nav.home");
    expect(keys).toContain("profile.language");
  });
});
