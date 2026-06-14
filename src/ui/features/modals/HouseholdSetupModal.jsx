import { useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal, Button, Caption, Body, Stack } from "../../index.js";
import { createHouseholdRoom, joinHouseholdRoom } from "../../../services/household/householdRoomService.js";
import { normalizeInviteCode, householdMemberLimit } from "../../../engines/householdRoom.js";

/**
 * Create or join a shared household room (requires sign-in + Supabase).
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function HouseholdSetupModal({ open, onClose }) {
  const { t } = useTranslation();
  const { settings, updateSettings } = useCommitTrack();
  const { user, isLoggedIn } = useAuth();
  const [mode, setMode] = useState("create");
  const [roomName, setRoomName] = useState(t("household.room.defaultName"));
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const applyRoom = (result) => {
    updateSettings({
      householdRoomId: result.roomId,
      householdInviteCode: result.inviteCode,
      householdRoomRole: result.role,
      householdRoomName: result.roomName,
      householdRoomMembers: result.members,
      householdRoomLocal: Boolean(result.local),
      householdMemberLimit: householdMemberLimit(settings),
      householdShareSpends: true,
      householdShareBillDetail: result.role === "owner",
      activeProfileId: "default",
      profiles: [{ id: "default", label: t("profile.defaultProfileLabel"), color: "indigo" }],
    });
    onClose();
  };

  const submit = async () => {
    setError("");
    if (!isLoggedIn || !user?.id) {
      setError(t("household.room.signInRequired"));
      return;
    }
    setBusy(true);
    try {
      const displayName = settings.displayName?.trim() || t("household.room.you");
      const result =
        mode === "create"
          ? await createHouseholdRoom({ userId: user.id, displayName, roomName, settings })
          : await joinHouseholdRoom({
              userId: user.id,
              displayName,
              inviteCode: normalizeInviteCode(inviteCode),
              settings,
            });

      if (!result.ok) {
        const known = [
          "not_configured",
          "invalid_code",
          "code_not_found",
          "create_failed",
          "migration_missing",
          "household_full",
        ];
        setError(
          known.includes(result.reason)
            ? t(`household.room.error.${result.reason}`)
            : t("household.room.error.generic"),
        );
        return;
      }
      applyRoom(result);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={t("household.setup.title")} onClose={onClose}>
      <Stack gap="md">
        <Caption className="block">{t("household.setup.subtitle")}</Caption>
        <Caption className="block ct-text-muted">
          {t("household.setup.seatLimit", { count: householdMemberLimit(settings) })}
        </Caption>
        <div className="ct-row gap-2">
          <button
            type="button"
            className={`ct-btn ct-btn-sm flex-1 ${mode === "create" ? "ct-btn-primary" : "ct-btn-outline"}`}
            onClick={() => setMode("create")}
          >
            {t("household.setup.create")}
          </button>
          <button
            type="button"
            className={`ct-btn ct-btn-sm flex-1 ${mode === "join" ? "ct-btn-primary" : "ct-btn-outline"}`}
            onClick={() => setMode("join")}
          >
            {t("household.setup.join")}
          </button>
        </div>
        {mode === "create" ? (
          <div>
            <label className="ct-field-label">{t("household.room.nameLabel")}</label>
            <input
              className="ct-input w-full"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value.slice(0, 60))}
            />
          </div>
        ) : (
          <div>
            <label className="ct-field-label">{t("household.room.codeLabel")}</label>
            <input
              className="ct-input w-full ct-numeral"
              value={inviteCode}
              onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
              placeholder="ABC123"
              maxLength={6}
            />
          </div>
        )}
        {error ? <Body className="ct-text-danger text-sm">{error}</Body> : null}
        <Button type="button" variant="primary" disabled={busy} onClick={submit}>
          {busy ? t("common.loading") : mode === "create" ? t("household.setup.createCta") : t("household.setup.joinCta")}
        </Button>
      </Stack>
    </Modal>
  );
}
