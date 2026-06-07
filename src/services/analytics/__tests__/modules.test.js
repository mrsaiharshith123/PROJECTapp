import { describe, expect, it } from "vitest";
import { moduleFromPath } from "../modules.js";

describe("moduleFromPath", () => {
  it("maps core routes to module ids", () => {
    expect(moduleFromPath("/")).toBe("home");
    expect(moduleFromPath("/commitments")).toBe("commitments");
    expect(moduleFromPath("/analytics")).toBe("stability_reports");
    expect(moduleFromPath("/admin")).toBe("admin");
  });

  it("strips hash and query", () => {
    expect(moduleFromPath("/profile?x=1")).toBe("profile");
    expect(moduleFromPath("/#dashboard-tools")).toBe("home");
  });
});
