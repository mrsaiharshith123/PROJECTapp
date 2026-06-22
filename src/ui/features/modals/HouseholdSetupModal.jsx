import { useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Modal, Button, Caption, Body, Stack, inputClassName } from "../../index.js";
import { createHouseholdRoom, joinHouseholdRoom } from "../../../services/household/householdRoomService.js";
import { normalizeInviteCode, householdMemberLimit } from "../../../engines/householdRoom.js";

/**
 * Create or join a shared household room (requires sign-in + Supabase).
 * @param {{ open: boolean, onClose: () => void, onComplete?: () => void }} props
 */
export default function HouseholdSetupModal({ open, onClose, onComplete }) {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const { user, isLoggedIn } = useAuth();
  const [mode, setMode] = useState("create");
  const [roomName, setRoomName] = useState(t("household.room.defaultName"));
  const [seatCount, setSeatCount] = useState(
    Math.max(2, Math.min(20, Number(settings.householdMemberLimit) || 4)),
  );
  const [dependents, setDependents] = useState(Math.max(0, Number(settings.dependents) || 0));
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const applyRoom = (result) => {
    const limit = Number(result.memberLimit) || householdMemberLimit(settings);
    updateSettings({
      userMode: "salaried",
      householdScope: "family",
      householdRoomId: result.roomId,
      householdInviteCode: result.inviteCode,
      householdRoomRole: result.role,
      householdRoomName: result.roomName,
      householdRoomMembers: result.members,
      householdRoomLocal: Boolean(result.local),
      householdMemberLimit: limit,
      dependents: mode === "create" ? Math.max(0, Math.floor(dependents) || 0) : settings.dependents,
      householdShareSpends: true,
      householdShareBillDetail: result.role === "owner",
      activeProfileId: "default",
      profiles: [{ id: "default", label: t("profile.defaultProfileLabel"), color: "indigo" }],
    });
    onComplete?.();
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
      const memberLimit = mode === "create" ? Math.min(20, Math.max(2, Math.floor(seatCount) || 2)) : undefined;
      const result =
        mode === "create"
          ? await createHouseholdRoom({ userId: user.id, displayName, roomName, settings, memberLimit })
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
      <Stack gap="md" className="ct-nw-panel">
        <div className="ct-hero-card lending ct-stack-sm">
          <Caption className="block">{t("household.setup.subtitle")}</Caption>
        </div>
        {mode === "create" ? (
          <div>
            <label className="ct-field-label">{t("household.setup.seatCountLabel")}</label>
            <input
              type="number"
              min={2}
              max={20}
              className={`${inputClassName()} ct-input-tint w-full`}
              value={seatCount}
              onChange={(e) =>
                setSeatCount(Math.min(20, Math.max(2, Math.floor(Number(e.target.value) || 2))))
              }
            />
            <Caption className="block mt-1">{t("household.setup.seatLimit", { count: seatCount })}</Caption>
            <label className="ct-field-label mt-3">{t("household.setup.dependentsLabel")}</label>
            <input
              type="number"
              min={0}
              className={`${inputClassName()} ct-input-tint w-full`}
              value={dependents === 0 ? "" : dependents}
              onChange={(e) => {
                const raw = e.target.value;
                setDependents(raw === "" ? 0 : Math.max(0, Math.floor(Number(raw) || 0)));
              }}
            />
            <Caption className="block mt-1">{t("household.setup.dependentsHint")}</Caption>
          </div>
        ) : (
          <Caption className="block ct-text-muted">{t("household.setup.joinSeatNote")}</Caption>
        )}
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
              className={`${inputClassName()} ct-input-tint w-full`}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value.slice(0, 60))}
            />
          </div>
        ) : (
          <div>
            <label className="ct-field-label">{t("household.room.codeLabel")}</label>
            <input
              className={`${inputClassName()} ct-input-tint w-full ct-numeral`}
              value={inviteCode}
              onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
              placeholder={t("household.room.codePlaceholder")}
              maxLength={6}
            />
          </div>
        )}
        {error ? <Body className="ct-text-danger text-sm">{error}</Body> : null}
        <Button type="button" variant="primary" size="lg" className="w-full" disabled={busy} onClick={submit}>
          {busy ? t("common.loading") : mode === "create" ? t("household.setup.createCta") : t("household.setup.joinCta")}
        </Button>
      </Stack>
    </Modal>
  );
}
