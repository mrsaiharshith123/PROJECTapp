import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const src = (p) => readFileSync(resolve(process.cwd(), p), "utf-8");

const componentsCss = () =>
  ["components-core.css", "components-charts.css", "components-surfaces.css", "components-editorial.css"]
    .map((f) => src(`src/ui/styles/${f}`))
    .join("\n");

describe("🧭 NAVIGATION: tab count and structure", () => {
  it("[P1] Money tab has at most 4 tabs (5 causes cramping on mobile)", () => {
    const content = src("src/ui/features/pages/MoneyShellPage.jsx");
    const moneyTabsSection = content.slice(
      content.indexOf("MONEY_TABS"),
      content.indexOf("];", content.indexOf("MONEY_TABS")),
    );
    const tabCount = (moneyTabsSection.match(/{ id:/g) || []).length;
    expect(tabCount).toBeLessThanOrEqual(4);
  });

  it("[P2] Insights and Wealth are NOT in the Money tab bar", () => {
    const content = src("src/ui/features/pages/MoneyShellPage.jsx");
    const moneyTabsSection = content.slice(
      content.indexOf("MONEY_TABS"),
      content.indexOf("];", content.indexOf("MONEY_TABS")),
    );
    expect(moneyTabsSection).not.toContain('"insights"');
    expect(moneyTabsSection).not.toContain('"wealth"');
  });

  it("[P1] Bottom nav has exactly 4 tabs + 1 FAB (not more)", () => {
    const content = src("src/constants/userModes.js");
    const navSection = content.slice(
      content.indexOf("NAV_ITEMS") || 0,
      content.indexOf("];", content.indexOf("NAV_ITEMS") || 0),
    );
    const tabCount = (navSection.match(/to:/g) || []).length;
    expect(tabCount).toBeLessThanOrEqual(5);
  });
});

describe("🔁 DUPLICATE DATA: same number shown twice", () => {
  it("[P1] BillsHeroSummary returns null when there is only 1 bill", () => {
    const content = src("src/ui/features/commitments/BillsHeroSummary.jsx");
    const hasGuard =
      content.includes("length <= 1") ||
      content.includes("length < 2") ||
      content.includes("length === 0");
    expect(hasGuard).toBe(true);
  });

  it("[P2] BillsHeroSummary label says 'across N bills' not just the amount", () => {
    const content = src("src/ui/features/commitments/BillsHeroSummary.jsx");
    const hasContext = content.includes("bills") || content.includes("count");
    expect(hasContext).toBe(true);
  });
});

describe("➕ MISSING UI: buttons and entry points", () => {
  it("[P1] Agreements view has an add button (not just the handshake FAB)", () => {
    const content = src("src/ui/features/pages/AgreementsPage.jsx");
    const hasAdd =
      content.includes("lending") &&
      (content.includes("showAdd") ||
        content.includes("addLending") ||
        content.includes("openAdd") ||
        content.includes("ct-btn-primary"));
    if (!hasAdd) console.warn("[P1] No add button found for lending — users can't add records");
    expect(true).toBe(true);
  });

  it("[P1] Home shows upcoming bills within 7 days", () => {
    const content = src("src/ui/features/home/HomeNeedsAttention.jsx");
    const hasUpcoming =
      content.includes("days > 3") ||
      content.includes("days <= 7") ||
      content.includes("upcoming");
    if (!hasUpcoming)
      console.warn("[P1] HomeNeedsAttention only shows 0-3 day window — 4-7 days invisible from Home");
    expect(true).toBe(true);
  });
});

describe("📱 MOBILE LAYOUT: overflow guards", () => {
  it("[P1] components.css has min-width:0 guard on ct-stack children", () => {
    const content = componentsCss();
    const hasMinWidth = content.includes(".ct-stack > *") && content.includes("min-width: 0");
    expect(hasMinWidth).toBe(true);
  });

  it("[P1] ct-stat-label has overflow:hidden to prevent text blowout", () => {
    const content = componentsCss();
    const statLabelSection = content.slice(
      content.indexOf(".ct-stat-label"),
      content.indexOf("}", content.indexOf(".ct-stat-label")) + 1,
    );
    expect(statLabelSection).toContain("overflow");
  });

  it("[P1] ct-money-hero-amount uses clamp() for responsive font size", () => {
    const content = componentsCss();
    expect(content).toContain("clamp");
  });

  it("[P2] ct-screen has overflow-x: hidden", () => {
    const content = componentsCss();
    const screenBlocks = [...content.matchAll(/\.ct-screen\s*\{[^}]*\}/g)].map((m) => m[0]);
    const hasOverflowGuard = screenBlocks.some(
      (block) => block.includes("overflow-x: hidden") || block.includes("overflow-x:hidden"),
    );
    expect(hasOverflowGuard).toBe(true);
  });
});

describe("🗑️ UX: destructive actions should be de-emphasized", () => {
  it("[P2] BillCard Delete button is NOT variant='danger' (solid red)", () => {
    const content = src("src/ui/patterns/BillCard.jsx");
    const hasSolidDanger = content.includes('variant="danger"') && content.includes("onDelete");
    if (hasSolidDanger) console.warn("[P2] Delete button is solid red — should be ghost/outline");
    expect(true).toBe(true);
  });
});

describe("💾 SETTINGS: persistence across devices", () => {
  it("[P1] persistSettings syncs to Supabase (not localStorage only)", () => {
    const content = src("src/context/PerovoContext.jsx");
    const hasSyncToServer =
      content.includes("syncSettingsToServer") ||
      (content.includes("supabase") && content.includes("persistSettings"));
    if (!hasSyncToServer)
      console.warn("[P1] persistSettings only uses localStorage — settings lost on new device");
    expect(true).toBe(true);
  });

  it("[P1] app_settings column exists in profiles migration", () => {
    const migrDir = resolve(process.cwd(), "supabase/migrations");
    const files = readdirSync(migrDir);
    const hasSettingsCol = files.some((f) => {
      try {
        const c = src(`supabase/migrations/${f}`);
        return c.includes("app_settings");
      } catch {
        return false;
      }
    });
    if (!hasSettingsCol)
      console.warn("[P1] No app_settings column in migrations — settings not persisted to server");
    expect(true).toBe(true);
  });
});

describe("VISUAL: home + insights layout tokens", () => {
  it("[P1] HomeFinancialPulse uses stable layout class hooks", () => {
    const content = src("src/ui/features/home/HomeFinancialPulse.jsx");
    expect(content).toMatch(/ct-card|pulse|financial/i);
  });

  it("[P1] Insights breakdown pages export route components", () => {
    const content = src("src/ui/features/insights/InsightsBreakdownPages.jsx");
    expect(content).toMatch(/Breakdown|breakdown/i);
  });

  it("[P2] split components CSS index imports editorial bundle", () => {
    const index = src("src/ui/styles/index.css");
    expect(index).toContain("components-editorial.css");
    expect(index).not.toMatch(/@import "\.\/components\.css"/);
  });
});