import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { isSalariedFamily } from "../constants/modeExperience.js";
import { fetchUserHouseholdRoom } from "../services/household/householdRoomService.js";
import { getLocalHouseholdRoomById } from "../engines/householdRoomLocal.js";
import HouseholdSetupModal from "../ui/features/modals/HouseholdSetupModal.jsx";

/** On family mode: rejoin server room or prompt create/join once. */
export default function HouseholdRoomBridge() {
  const { user, isLoggedIn, isReady } = useAuth();
  const { settings, updateSettings } = useCommitTrack();
  const [setupOpen, setSetupOpen] = useState(false);
  const syncedRef = useRef("");

  const isFamily = isSalariedFamily(settings);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !user?.id || !isFamily) {
      syncedRef.current = "";
      return;
    }

    const sessionKey = `${user.id}:family`;
    if (syncedRef.current === sessionKey) return;

    let cancelled = false;

    (async () => {
      const roomId = settings.householdRoomId || "";
      if (roomId && (settings.householdRoomLocal || String(roomId).startsWith("local-"))) {
        const local = getLocalHouseholdRoomById(roomId);
        if (cancelled) return;
        if (local) {
          updateSettings({
            householdRoomMembers: local.members,
            householdInviteCode: local.inviteCode,
            householdMemberLimit: local.memberLimit || settings.householdMemberLimit,
          });
          syncedRef.current = sessionKey;
          return;
        }
      }

      const remote = await fetchUserHouseholdRoom(user.id);
      if (cancelled) return;

      if (remote) {
        updateSettings({
          householdRoomId: remote.roomId,
          householdInviteCode: remote.inviteCode,
          householdRoomName: remote.roomName,
          householdRoomRole: remote.role,
          householdRoomMembers: remote.members,
          householdMemberLimit: remote.memberLimit || settings.householdMemberLimit,
          householdShareSpends: remote.shareSpends,
          householdShareBillDetail: remote.shareBillDetail,
          householdRoomLocal: remote.local,
        });
        syncedRef.current = sessionKey;
        return;
      }

      if (!settings.householdRoomId) {
        setSetupOpen(true);
      }
      syncedRef.current = sessionKey;
    })();

    return () => {
      cancelled = true;
    };
  }, [isReady, isLoggedIn, user?.id, isFamily, settings.householdRoomId, settings.householdRoomLocal, settings.householdMemberLimit, updateSettings]);

  if (!isFamily) return null;

  return <HouseholdSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />;
}
