import { describe, it, expect } from "vitest";
import * as engine from "../forecast.js";

describe("src/engines/forecast.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});
