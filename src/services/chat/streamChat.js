const STREAM_KEY = import.meta.env.VITE_STREAM_API_KEY || "";

export function isChatConfigured() {
  return Boolean(STREAM_KEY);
}

/**
 * Stream chat connects via the stream-token Edge Function (secret never client-side).
 * Full Stream SDK wiring is added when stream-chat is installed and token endpoint is live.
 * @param {{ userId: string, userName: string, token: string }} _params
 */
export async function connectChatUser(_params) {
  if (!isChatConfigured()) return null;
  return null;
}

/**
 * @param {string} _roomId
 * @param {string[]} _members
 */
export async function getOrCreateRoomChannel(_roomId, _members) {
  return null;
}

export function disconnectChatUser() {
  /* no-op until Stream client is connected */
}
