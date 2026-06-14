import { useEffect, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { fetchUserHouseholdRoom } from "../../../services/household/householdRoomService.js";
import { getLocalHouseholdRoomById } from "../../../engines/householdRoomLocal.js";
import { householdMemberLimit } from "../../../engines/householdRoom.js";
import { formatInr } from "../../../constants/symbols.js";
import { computeHouseholdSpendBreakdown } from "../../../engines/householdSpendBreakdown.js";
import { Card, Heading, Caption, Body, Button, Badge, Stack } from "../../index.js";
import HouseholdSetupModal from "../modals/HouseholdSetupModal.jsx";

const MEMBER_LABEL_KEYS = {
  self: "household.member.self",
  spouse: "household.member.spouse",
  shared: "household.member.shared",
  child: "household.member.child",
};

export default function HouseholdHubSection() {
  const { t } = useTranslation();
  const { settings, updateSettings, commitments, dailySpends, getEffectiveStatus, todayStr } =
    useCommitTrack();
  const { user, isLoggedIn } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const isFamily = isSalariedFamily(settings);
  const roomId = settings.householdRoomId || "";
  const members = settings.householdRoomMembers || [];
  const isOwner = settings.householdRoomRole === "owner";

  const memberLimit = settings.householdMemberLimit || householdMemberLimit(settings);

  useEffect(() => {
    if (!isFamily || !roomId) return;
    if (settings.householdRoomLocal || String(roomId).startsWith("local-")) {
      const local = getLocalHouseholdRoomById(roomId);
      if (local?.members) {
        updateSettings({ householdRoomMembers: local.members, householdInviteCode: local.inviteCode });
      }
      return;
    }
    if (!isLoggedIn || !user?.id) return;
    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const remote = await fetchUserHouseholdRoom(user.id);
        if (cancelled || !remote) return;
        updateSettings({
          householdRoomId: remote.roomId,
          householdInviteCode: remote.inviteCode,
          householdRoomName: remote.roomName,
          householdRoomRole: remote.role,
          householdRoomMembers: remote.members,
          householdShareSpends: remote.shareSpends,
          householdShareBillDetail: remote.shareBillDetail,
        });
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync once per sign-in + room
  }, [isFamily, isLoggedIn, user?.id, roomId]);

  const spendRows = isFamily
    ? computeHouseholdSpendBreakdown(commitments, dailySpends, todayStr, getEffectiveStatus)
    : [];

  if (!isFamily) return null;

  return (
    <>
      <Card variant="flat" className="ct-stack">
        <Heading level={3}>{t("household.hub.title")}</Heading>
        <Caption className="block">{t("household.hub.subtitle")}</Caption>

        {!roomId ? (
          <Stack gap="sm">
            <Caption className="block">{t("household.hub.notLinked")}</Caption>
            <Button type="button" variant="primary" size="sm" className="!w-auto" onClick={() => setSetupOpen(true)}>
              {t("household.hub.setupCta")}
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <div className="ct-row-between gap-2 flex-wrap">
              <Body className="font-semibold">{settings.householdRoomName || t("household.room.defaultName")}</Body>
              {syncing ? <Caption>{t("common.loading")}</Caption> : null}
            </div>
            {isOwner && settings.householdInviteCode ? (
              <div className="ct-hero-inset ct-stack-sm">
                <Caption className="block">{t("household.hub.inviteCode")}</Caption>
                <Body className="ct-numeral font-bold tracking-widest">{settings.householdInviteCode}</Body>
                <Caption className="block ct-text-muted">{t("household.hub.inviteHint")}</Caption>
              </div>
            ) : null}
            <Caption className="block font-semibold">
              {t("household.hub.members")} ({members.length}/{memberLimit})
            </Caption>
            {members.length === 0 ? (
              <Caption>{t("household.hub.membersEmpty")}</Caption>
            ) : (
              members.map((m) => (
                <div key={m.userId} className="ct-row-between gap-2 py-1 border-b border-[var(--ct-border)]">
                  <div>
                    <Body className="font-semibold">{m.displayName}</Body>
                    <Caption>
                      {m.role === "owner" ? t("household.hub.roleOwner") : t("household.hub.roleMember")}
                    </Caption>
                  </div>
                  <Badge tone={m.shareSpends ? "success" : "default"}>
                    {m.shareSpends ? t("household.hub.sharingOn") : t("household.hub.sharingOff")}
                  </Badge>
                </div>
              ))
            )}
            <Caption className="block ct-text-muted">{t("household.hub.privacyNote")}</Caption>
          </Stack>
        )}

        {spendRows.length > 0 && (
          <div className="ct-stack-sm mt-2 pt-2 border-t border-[var(--ct-border)]">
            <Caption className="block font-semibold">{t("household.hub.spendThisMonth")}</Caption>
            {spendRows.map((row) => (
              <div key={row.id} className="ct-row-between gap-2">
                <Caption>{t(MEMBER_LABEL_KEYS[row.id] || "household.member.shared")}</Caption>
                <Body className="ct-numeral font-semibold">{formatInr(row.total)}</Body>
              </div>
            ))}
            {!isOwner ? (
              <Caption className="block ct-text-muted">{t("household.hub.spendMemberNote")}</Caption>
            ) : (
              <Caption className="block ct-text-muted">{t("household.hub.spendOwnerNote")}</Caption>
            )}
          </div>
        )}

        <div className="ct-row gap-2 flex-wrap">
          <label className="ct-row gap-2 items-center text-sm">
            <input
              type="checkbox"
              checked={settings.householdShareSpends !== false}
              onChange={(e) => updateSettings({ householdShareSpends: e.target.checked })}
            />
            {t("household.hub.shareMySpends")}
          </label>
          {isOwner && (
            <label className="ct-row gap-2 items-center text-sm">
              <input
                type="checkbox"
                checked={Boolean(settings.householdShareBillDetail)}
                onChange={(e) => updateSettings({ householdShareBillDetail: e.target.checked })}
              />
              {t("household.hub.shareBillDetail")}
            </label>
          )}
        </div>
      </Card>
      <HouseholdSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />
    </>
  );
}
