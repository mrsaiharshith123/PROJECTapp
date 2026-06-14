import { generateHouseholdInviteCode, normalizeInviteCode } from "./householdRoom.js";

const REGISTRY_KEY = "perovo_household_registry";

function readRegistry() {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRegistry(reg) {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  } catch {
    /* ignore */
  }
}

function newLocalRoomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}`;
}

/**
 * @param {{ userId: string, displayName: string, roomName?: string, memberLimit: number }} params
 */
export function createLocalHouseholdRoom({ userId, displayName, roomName, memberLimit }) {
  const code = generateHouseholdInviteCode();
  const roomId = newLocalRoomId();
  const reg = readRegistry();
  const members = [
    {
      userId,
      displayName: String(displayName || "You").slice(0, 40),
      role: "owner",
      shareSpends: true,
      shareBillDetail: true,
    },
  ];
  const room = {
    roomId,
    inviteCode: code,
    roomName: String(roomName || "Our household").slice(0, 60),
    ownerId: userId,
    memberLimit,
    members,
    local: true,
  };
  reg[code] = room;
  writeRegistry(reg);
  return {
    ok: true,
    roomId,
    inviteCode: code,
    roomName: room.roomName,
    role: "owner",
    members,
    memberLimit,
    local: true,
  };
}

/** @param {string} roomId */
export function getLocalHouseholdRoomById(roomId) {
  const reg = readRegistry();
  return Object.values(reg).find((r) => r.roomId === roomId) || null;
}

/** @param {string} roomId @param {number} memberLimit */
export function updateLocalHouseholdMemberLimit(roomId, memberLimit) {
  const reg = readRegistry();
  const entry = Object.entries(reg).find(([, r]) => r.roomId === roomId);
  if (!entry) return;
  const [code, room] = entry;
  room.memberLimit = Math.min(20, Math.max(2, Math.floor(Number(memberLimit) || 2)));
  reg[code] = room;
  writeRegistry(reg);
}

/**
 * @param {{ userId: string, displayName: string, inviteCode: string, memberLimit: number }} params
 */
export function joinLocalHouseholdRoom({ userId, displayName, inviteCode, memberLimit }) {
  const code = normalizeInviteCode(inviteCode);
  const reg = readRegistry();
  const room = reg[code];
  if (!room) return { ok: false, reason: "code_not_found" };

  const limit = Number(room.memberLimit) || memberLimit;
  const members = Array.isArray(room.members) ? [...room.members] : [];
  if (members.some((m) => m.userId === userId)) {
    return {
      ok: true,
      roomId: room.roomId,
      inviteCode: room.inviteCode,
      roomName: room.roomName,
      role: room.ownerId === userId ? "owner" : "member",
      members,
      local: true,
    };
  }
  if (members.length >= limit) return { ok: false, reason: "household_full" };

  members.push({
    userId,
    displayName: String(displayName || "Member").slice(0, 40),
    role: room.ownerId === userId ? "owner" : "member",
    shareSpends: true,
    shareBillDetail: false,
  });
  room.members = members;
  reg[code] = room;
  writeRegistry(reg);

  return {
    ok: true,
    roomId: room.roomId,
    inviteCode: room.inviteCode,
    roomName: room.roomName,
    role: room.ownerId === userId ? "owner" : "member",
    members,
    local: true,
  };
}

/**
 * @param {{ userId: string, roomId: string }} params
 */
export function leaveLocalHouseholdRoom({ userId, roomId }) {
  const reg = readRegistry();
  const entry = Object.entries(reg).find(([, r]) => r.roomId === roomId);
  if (!entry) return { ok: false };
  const [code, room] = entry;
  const isOwner = room.ownerId === userId;
  if (isOwner) {
    delete reg[code];
  } else {
    room.members = (room.members || []).filter((m) => m.userId !== userId);
    if (room.members.length === 0) delete reg[code];
    else reg[code] = room;
  }
  writeRegistry(reg);
  return { ok: true };
}
