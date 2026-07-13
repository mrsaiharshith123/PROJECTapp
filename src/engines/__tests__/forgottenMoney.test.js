import { describe, it, expect } from "vitest";
import { shouldPromptForgottenEpf } from "../forgottenMoney.js";

describe("shouldPromptForgottenEpf", () => {
  it("prompts on first-ever check", () => {
    expect(shouldPromptForgottenEpf({}, [], 1000)).toBe(true);
  });

  it("never prompts once dismissed", () => {
    expect(shouldPromptForgottenEpf({ forgottenMoneyDismissed: true }, [], 1000)).toBe(false);
  });

  it("does not re-prompt a user who already tracks an EPF entry and was asked before", () => {
    const settings = { forgottenMoneyLastPromptedAt: 1000 };
    const entries = [{ categoryId: "pf_epf", value: 100000 }];
    expect(shouldPromptForgottenEpf(settings, entries, 1000 + 200 * 86400000)).toBe(false);
  });

  it("re-prompts after the interval elapses for a user with no EPF tracked", () => {
    const settings = { forgottenMoneyLastPromptedAt: 1000 };
    expect(shouldPromptForgottenEpf(settings, [], 1000 + 200 * 86400000, 120)).toBe(true);
    expect(shouldPromptForgottenEpf(settings, [], 1000 + 10 * 86400000, 120)).toBe(false);
  });
});
