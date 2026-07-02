import { describe, it, expect } from "vitest";
import * as engine from "../_guard.js";

describe("src/engines/_guard.js", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});
