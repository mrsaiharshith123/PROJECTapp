import { describe, it, expect } from "vitest";
import * as engine from "../netWorthBenchmark.js";

describe("src/engines/netWorthBenchmark.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});
