import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalHouseholdRoom,
  joinLocalHouseholdRoom,
  getLocalHouseholdRoomById,
  updateLocalHouseholdMemberLimit,
} from "../householdRoomLocal.js";

function mockStorage() {
  /** @type {Record<string, string>} */
  const store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

describe("householdRoomLocal", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockStorage());
  });

  it("creates and retrieves a local room", () => {
    const created = createLocalHouseholdRoom({
      userId: "u1",
      displayName: "Alex",
      roomName: "Our home",
      memberLimit: 4,
    });
    expect(created.ok).toBe(true);
    expect(created.local).toBe(true);
    expect(created.inviteCode).toHaveLength(6);

    const loaded = getLocalHouseholdRoomById(created.roomId);
    expect(loaded?.inviteCode).toBe(created.inviteCode);
    expect(loaded?.members).toHaveLength(1);
  });

  it("joins by invite code and enforces member limit", () => {
    const created = createLocalHouseholdRoom({
      userId: "u1",
      displayName: "Owner",
      memberLimit: 2,
    });
    const join = joinLocalHouseholdRoom({
      userId: "u2",
      displayName: "Partner",
      inviteCode: created.inviteCode,
      memberLimit: 2,
    });
    expect(join.ok).toBe(true);
    expect(join.members).toHaveLength(2);

    const full = joinLocalHouseholdRoom({
      userId: "u3",
      displayName: "Guest",
      inviteCode: created.inviteCode,
      memberLimit: 2,
    });
    expect(full.ok).toBe(false);
    expect(full.reason).toBe("household_full");
  });

  it("updates member limit on existing room", () => {
    const created = createLocalHouseholdRoom({
      userId: "u1",
      displayName: "Owner",
      memberLimit: 2,
    });
    updateLocalHouseholdMemberLimit(created.roomId, 6);
    const loaded = getLocalHouseholdRoomById(created.roomId);
    expect(loaded?.memberLimit).toBe(6);
  });
});
