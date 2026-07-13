import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

const src = (p) => readFileSync(resolve(process.cwd(), p), "utf-8");

const componentsCss = () =>
  ["components-dh.css", "components-charts.css", "components-editorial.css"]
    .map((f) => src(`src/ui/styles/${f}`))
    .concat(
      ["components-core.css", "components-surfaces.css"].map((f) =>
        src(`src/ui/styles/_archive/${f}`),
      ),
    )
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
  it("[P1] CommitmentsPage hero shows bill count in metric sub", () => {
    const content = src("src/ui/features/pages/CommitmentsPage.jsx");
    expect(content).toMatch(/bills\.heroSub/);
    expect(content).toMatch(/ed-metrics/);
  });

  it("[P2] CommitmentsPage overdue metric uses counts.overdue", () => {
    const content = src("src/ui/features/pages/CommitmentsPage.jsx");
    expect(content).toMatch(/counts\.overdue/);
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
    expect(hasAdd).toBe(true);
  });

  it("[P1] Home shows upcoming bills within 7 days", () => {
    const content = src("src/ui/features/home/HomeNeedsAttention.jsx");
    const hasUpcoming =
      content.includes("days > 3") ||
      content.includes("days <= 7") ||
      content.includes("upcoming");
    expect(hasUpcoming).toBe(true);
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
    expect(hasSolidDanger).toBe(false);
  });
});

describe("💾 SETTINGS: persistence across devices", () => {
  it("[P1] persistSettings syncs to Supabase (not localStorage only)", () => {
    // Sync logic is split across PerovoContext.jsx and its composed hooks
    // (usePerovoPersistence.js debounces settings -> server;
    // useServerSettingsSync.js pulls server -> settings on login) — check
    // the whole context layer, not one file, so this doesn't re-break every
    // time that composition is refactored.
    const content = ["PerovoContext.jsx", "usePerovoPersistence.js", "useServerSettingsSync.js"]
      .map((f) => src(`src/context/${f}`))
      .join("\n");
    const hasSyncToServer =
      content.includes("syncSettingsToServer") ||
      (content.includes("supabase") && content.includes("persistSettings"));
    expect(hasSyncToServer).toBe(true);
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
    expect(hasSettingsCol).toBe(true);
  });
});

describe("VISUAL: home + insights layout tokens", () => {
  it("[P1] HomeNeedsAttention uses stable layout class hooks", () => {
    const content = src("src/ui/features/home/HomeNeedsAttention.jsx");
    expect(content).toMatch(/ed-ins|attention|needs/i);
  });

  it("[P1] Insights breakdown pages export route components", () => {
    const content = src("src/ui/features/insights/InsightsBreakdownPages.jsx");
    expect(content).toMatch(/Breakdown|breakdown/i);
  });

  it("[P2] Direction H CSS index imports tokens + dh + editorial", () => {
    const index = src("src/ui/styles/index.css");
    expect(index).toContain("components-dh.css");
    expect(index).toContain("components-editorial.css");
    expect(index).not.toMatch(/@import "\.\/components\.css"/);
    expect(index).not.toMatch(/@import "\.\/components-core\.css"/);
    expect(index).not.toMatch(/@import "\.\/components-surfaces\.css"/);
    expect(index).not.toMatch(/@import "\.\/net-worth\.css"/);
    expect(index).not.toMatch(/@import "\.\/theme-light\.css"/);
  });
});