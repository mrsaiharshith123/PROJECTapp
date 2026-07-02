import { describe, it, expect } from "vitest";
import * as engine from "../pressureIntelligence.js";

describe("src/engines/pressureIntelligence.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});
