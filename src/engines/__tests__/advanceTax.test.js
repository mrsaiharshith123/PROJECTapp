import { describe, it, expect } from "vitest";
import * as engine from "../advanceTax.js";

describe("src/engines/advanceTax.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});
