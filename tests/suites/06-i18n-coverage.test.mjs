import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import en from "../../src/i18n/messages/en.js";

const MESSAGES_DIR = join(process.cwd(), "src/i18n/messages");
const LOCALES = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".js") && f !== "en.js");

function loadLocale(code) {
  return readFileSync(join(MESSAGES_DIR, `${code}.js`), "utf8");
}

describe("I18N: locale coverage", () => {
  it("[P1] English messages export a non-empty object", () => {
    expect(typeof en).toBe("object");
    expect(Object.keys(en).length).toBeGreaterThan(100);
  });

  it("[P1] every locale file exports default object", () => {
    for (const file of LOCALES) {
      const code = file.replace(".js", "");
      const content = loadLocale(code);
      expect(content).toMatch(/export\s+default/);
    }
  });

  it("[P2] critical keys exist in English", () => {
    const critical = [
      "brand.appName",
      "nav.home",
      "nav.money",
      "tools.loan.tabExtra",
      "profile.backup",
    ];
    for (const key of critical) {
      expect(en[key], `missing en key: ${key}`).toBeTruthy();
    }
  });

  it("[P2] no locale file is empty stub", () => {
    for (const file of LOCALES) {
      const content = loadLocale(file.replace(".js", ""));
      expect(content.length).toBeGreaterThan(500);
    }
  });
});
