import { describe, expect, it } from "vitest";
import { moduleFromPath } from "../modules.js";

describe("moduleFromPath", () => {
  it("maps core routes to module ids", () => {
    expect(moduleFromPath("/")).toBe("home");
    expect(moduleFromPath("/money/bills")).toBe("commitments");
    expect(moduleFromPath("/money/lending")).toBe("lending");
    expect(moduleFromPath("/money/insights")).toBe("stability_reports");
    expect(moduleFromPath("/commitments")).toBe("commitments");
    expect(moduleFromPath("/analytics")).toBe("stability_reports");
    expect(moduleFromPath("/plan")).toBe("planning");
    expect(moduleFromPath("/admin")).toBe("admin");
  });

  it("strips hash and query", () => {
    expect(moduleFromPath("/profile?x=1")).toBe("profile");
    expect(moduleFromPath("/#dashboard-tools")).toBe("home");
  });
});
