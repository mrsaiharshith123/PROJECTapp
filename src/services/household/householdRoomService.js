import { getSupabaseClient } from "../supabase/auth.js";
import {
  generateHouseholdInviteCode,
  isValidInviteCode,
  normalizeInviteCode,
  mapHouseholdCloudError,
  householdMemberLimit,
} from "../../engines/householdRoom.js";
import { createLocalHouseholdRoom, joinLocalHouseholdRoom } from "../../engines/householdRoomLocal.js";

async function createHouseholdRoomCloud({ userId, displayName, roomName, memberLimit }) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const inviteCode = generateHouseholdInviteCode();
  const { data: room, error: roomErr } = await supabase
    .from("household_rooms")
    .insert({
      invite_code: inviteCode,
      owner_id: userId,
      name: String(roomName || "Our household").slice(0, 60),
      member_limit: memberLimit,
    })
    .select("id, invite_code, name")
    .single();

  if (roomErr || !room) {
    return { ok: false, reason: mapHouseholdCloudError(roomErr?.message || "create_failed") };
  }

  const { error: memberErr } = await supabase.from("household_room_members").insert({
    room_id: room.id,
    user_id: userId,
    display_name: String(displayName || "You").slice(0, 40),
    role: "owner",
    share_spends: true,
    share_bill_detail: true,
  });

  if (memberErr) {
    return { ok: false, reason: mapHouseholdCloudError(memberErr.message) };
  }

  const members = await fetchHouseholdRoomMembers(room.id);
  return {
    ok: true,
    roomId: room.id,
    inviteCode: room.invite_code,
    roomName: room.name,
    role: "owner",
    members,
    memberLimit,
    local: false,
  };
}

async function joinHouseholdRoomCloud({ userId, displayName, inviteCode, memberLimit }) {
  const supabase = getSupabaseClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const code = normalizeInviteCode(inviteCode);
  if (!isValidInviteCode(code)) return { ok: false, reason: "invalid_code" };

  const { data: room, error: roomErr } = await supabase
    .from("household_rooms")
    .select("id, invite_code, name, owner_id, member_limit")
    .eq("invite_code", code)
    .maybeSingle();

  if (roomErr || !room) return { ok: false, reason: "code_not_found" };

  const existing = await fetchHouseholdRoomMembers(room.id);
  const limit = Number(room.member_limit) || memberLimit;
  if (!existing.some((m) => m.userId === userId) && existing.length >= limit) {
    return { ok: false, reason: "household_full" };
  }

  const { error: memberErr } = await supabase.from("household_room_members").upsert(
    {
      room_id: room.id,
      user_id: userId,
      display_name: String(displayName || "Member").slice(0, 40),
      role: "member",
      share_spends: true,
      share_bill_detail: false,
    },
    { onConflict: "room_id,user_id" },
  );

  if (memberErr) return { ok: false, reason: mapHouseholdCloudError(memberErr.message) };

  const members = await fetchHouseholdRoomMembers(room.id);
  return {
    ok: true,
    roomId: room.id,
    inviteCode: room.invite_code,
    roomName: room.name,
    role: room.owner_id === userId ? "owner" : "member",
    members,
    local: false,
  };
}

/**
 * @param {{ userId: string, displayName: string, roomName?: string, settings?: object, memberLimit?: number }} params
 */
export async function createHouseholdRoom({
  userId,
  displayName,
  roomName = "Our household",
  settings = {},
  memberLimit: memberLimitOverride,
}) {
  const memberLimit =
    memberLimitOverride != null && memberLimitOverride >= 2
      ? Math.min(20, Math.floor(memberLimitOverride))
      : householdMemberLimit(settings);
  try {
    const cloud = await createHouseholdRoomCloud({ userId, displayName, roomName, memberLimit });
    if (cloud.ok) return cloud;
  } catch {
    /* fall through to local */
  }
  return createLocalHouseholdRoom({ userId, displayName, roomName, memberLimit });
}

/**
 * @param {{ userId: string, displayName: string, inviteCode: string, settings?: object }} params
 */
export async function joinHouseholdRoom({ userId, displayName, inviteCode, settings = {} }) {
  const memberLimit = householdMemberLimit(settings);
  const code = normalizeInviteCode(inviteCode);
  if (!isValidInviteCode(code)) return { ok: false, reason: "invalid_code" };

  const local = joinLocalHouseholdRoom({ userId, displayName, inviteCode: code, memberLimit });
  if (local.ok) return local;

  const cloud = await joinHouseholdRoomCloud({ userId, displayName, inviteCode: code, memberLimit });
  if (cloud.ok) return cloud;

  if (cloud.reason === "code_not_found" && local.reason === "code_not_found") {
    return { ok: false, reason: "code_not_found" };
  }
  return cloud.ok === false ? cloud : local;
}

/** @param {string} roomId */
export async function fetchHouseholdRoomMembers(roomId) {
  const supabase = getSupabaseClient();
  if (!supabase || !roomId || String(roomId).startsWith("local-")) return [];

  const { data, error } = await supabase
    .from("household_room_members")
    .select("user_id, display_name, role, share_spends, share_bill_detail, joined_at")
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return data.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name || "Member",
    role: m.role || "member",
    shareSpends: m.share_spends !== false,
    shareBillDetail: Boolean(m.share_bill_detail),
    joinedAt: m.joined_at,
  }));
}

/** @param {string} userId */
export async function fetchUserHouseholdRoom(userId) {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return null;

  const { data: membership, error } = await supabase
    .from("household_room_members")
    .select("room_id, role, share_spends, share_bill_detail, household_rooms(id, invite_code, name, owner_id, member_limit)")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !membership?.household_rooms) return null;
  const room = membership.household_rooms;
  const members = await fetchHouseholdRoomMembers(room.id);
  return {
    roomId: room.id,
    inviteCode: room.invite_code,
    roomName: room.name,
    role: membership.role || "member",
    memberLimit: Number(room.member_limit) || householdMemberLimit({}),
    shareSpends: membership.share_spends !== false,
    shareBillDetail: Boolean(membership.share_bill_detail),
    members,
    local: false,
  };
}
