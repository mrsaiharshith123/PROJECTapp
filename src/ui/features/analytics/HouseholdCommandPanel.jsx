import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateInsight } from "../../../i18n/insightLabels.js";
import { useFamilyCommandIntel } from "../../../hooks/useFamilyCommandIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { fetchUserHouseholdRoom } from "../../../services/household/householdRoomService.js";
import { getLocalHouseholdRoomById } from "../../../engines/householdRoomLocal.js";
import { householdMemberLimit } from "../../../engines/householdRoom.js";
import { formatInr } from "../../../constants/symbols.js";
import { Heading, Caption, Body, Badge, Button, InfoTip } from "../../index.js";
import { insightToneClass } from "../../tokens/severity.js";
import HouseholdSetupModal from "../modals/HouseholdSetupModal.jsx";
import HouseholdDependentsEditorModal from "../modals/HouseholdDependentsEditorModal.jsx";
import HouseholdFamilyBadge from "../../patterns/HouseholdFamilyBadge.jsx";
import { useCountUp } from "../../hooks/useCountUp.js";

const TIER_KEYS = {
  thriving: "family.command.tierThriving",
  steady: "family.command.tierSteady",
  watch: "family.command.tierWatch",
  fragile: "family.command.tierFragile",
};

function localRoomMatchesSettings(settings, local) {
  const memberLimit = local.memberLimit || settings.householdMemberLimit;
  return (
    JSON.stringify(settings.householdRoomMembers || []) === JSON.stringify(local.members || []) &&
    settings.householdInviteCode === local.inviteCode &&
    settings.householdMemberLimit === memberLimit
  );
}

function remoteRoomMatchesSettings(settings, remote) {
  const memberLimit = remote.memberLimit || settings.householdMemberLimit;
  return (
    String(settings.householdRoomId || "") === String(remote.roomId || "") &&
    settings.householdInviteCode === remote.inviteCode &&
    settings.householdRoomName === remote.roomName &&
    settings.householdRoomRole === remote.role &&
    JSON.stringify(settings.householdRoomMembers || []) === JSON.stringify(remote.members || []) &&
    settings.householdMemberLimit === memberLimit &&
    settings.householdShareSpends === remote.shareSpends &&
    settings.householdShareBillDetail === remote.shareBillDetail
  );
}

/** Unified household hub + command center — room, members, stability, outlook. */
export default function HouseholdCommandPanel() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const cmd = useFamilyCommandIntel();
  const stable = useStabilityIntel();
  const { settings, updateSettings } = usePerovo();
  const { user, isLoggedIn } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncedRef = useRef("");

  const isFamily = isSalariedFamily(settings);
  const roomId = settings.householdRoomId || "";
  const members = settings.householdRoomMembers || [];
  const isOwner = settings.householdRoomRole === "owner";
  const memberLimit = settings.householdMemberLimit || householdMemberLimit(settings);
  const roomLabel = settings.householdRoomName || t("household.room.defaultName");

  useEffect(() => {
    if (!isFamily || !roomId) {
      syncedRef.current = "";
      return;
    }

    const syncKey = `${roomId}:${isLoggedIn ? user?.id || "" : "guest"}`;
    if (settings.householdRoomLocal || String(roomId).startsWith("local-")) {
      const local = getLocalHouseholdRoomById(roomId);
      if (local?.members && !localRoomMatchesSettings(settings, local)) {
        updateSettings({
          householdRoomMembers: local.members,
          householdInviteCode: local.inviteCode,
          householdMemberLimit: local.memberLimit || settings.householdMemberLimit,
        });
      }
      syncedRef.current = syncKey;
      return;
    }
    if (!isLoggedIn || !user?.id) return;
    if (syncedRef.current === syncKey) return;

    let cancelled = false;
    (async () => {
      setSyncing(true);
      try {
        const remote = await fetchUserHouseholdRoom(user.id);
        if (cancelled || !remote) return;
        if (!remoteRoomMatchesSettings(settings, remote)) {
          updateSettings({
            householdRoomId: remote.roomId,
            householdInviteCode: remote.inviteCode,
            householdRoomName: remote.roomName,
            householdRoomRole: remote.role,
            householdRoomMembers: remote.members,
            householdMemberLimit: remote.memberLimit || settings.householdMemberLimit,
            householdShareSpends: remote.shareSpends,
            householdShareBillDetail: remote.shareBillDetail,
          });
        }
        syncedRef.current = syncKey;
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync on room + sign-in
  }, [isFamily, isLoggedIn, user?.id, roomId]);

  const countedFreeCash = useCountUp(
    Math.max(0, Math.round(cmd?.household?.combinedFreeCash ?? 0)),
    900,
  );
  const countedBurden = useCountUp(Math.max(0, Math.round(cmd?.household?.combinedBurden ?? 0)), 900);

  if (!cmd || !isFamily) return null;

  const { stability, household, forecast, dependency, insights, emergencyPct, sharedGoals } = cmd;
  const tierKey = TIER_KEYS[stability.tier] || TIER_KEYS.steady;
  const dependentCount = Math.max(0, Number(settings.dependents) || 0);
  const runwayMonths = stable.survival?.survivalMonths;

  return (
    <>
      <div className="ct-hero-card survival ct-family-command ct-household-hub ct-stack relative">
        <div className="ct-hero-glow teal" aria-hidden />
        <div className="relative ct-stack">
        <div className="ct-row-between gap-2 flex-wrap items-start">
          <div className="ct-row gap-2 items-start flex-wrap min-w-0">
            <div className="min-w-0">
              <Heading level={3}>{t("household.commandHub.title")}</Heading>
              <Caption className="block mt-0.5">
                {roomId
                  ? t("household.commandHub.roomLine", {
                      name: roomLabel,
                      count: members.length,
                      limit: memberLimit,
                    })
                  : t("household.commandHub.subtitle")}
              </Caption>
            </div>
            <HouseholdFamilyBadge
              count={dependentCount}
              onEdit={() => setEditOpen(true)}
              editLabel={t("household.edit.open")}
            />
          </div>
          <Badge tone={stability.tier === "fragile" || stability.tier === "watch" ? "warning" : "success"}>
            {t(tierKey)}
          </Badge>
        </div>

        {!roomId ? (
          <div className="ct-stat-tile indigo ct-stack-sm">
            <Caption className="block">{t("household.hub.notLinked")}</Caption>
            <div className="ct-row gap-2 flex-wrap">
              <Button type="button" variant="primary" size="sm" className="!w-auto" onClick={() => setSetupOpen(true)}>
                {t("household.hub.setupCta")}
              </Button>
              <Button type="button" variant="outline" size="sm" className="!w-auto" onClick={() => navigate("/family-room")}>
                {t("profile.familyRoomLink")}
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" className="!w-auto self-start" onClick={() => navigate("/family-room")}>
            {t("profile.familyRoomLink")}
          </Button>
        )}

        <div className="ct-grid-2 gap-2">
          <div className={`ct-stat-tile ${household.combinedFreeCash < 0 ? "danger" : "teal"}`} data-guide="free-cash">
            <p className="ct-stat-label">{t("family.command.householdFree")}</p>
            <p className="ct-stat-value ct-numeral">{formatInr(countedFreeCash)}</p>
          </div>
          <div className="ct-stat-tile indigo" data-guide="survival-months">
            <p className="ct-stat-label">{t("home.strip.familyRunway")}</p>
            <p className="ct-stat-value ct-numeral">{runwayMonths != null ? `${runwayMonths}m` : "—"}</p>
          </div>
        </div>

        <div className="ct-grid-2 gap-2">
          <div className="ct-stat-tile danger">
            <p className="ct-stat-label">{t("family.command.obligations")}</p>
            <p className="ct-stat-value ct-numeral">{formatInr(countedBurden)}</p>
          </div>
          <div className="ct-stat-tile indigo">
            <p className="ct-stat-label">{t("family.command.dependents")}</p>
            <p className="ct-stat-value ct-numeral">{dependentCount}</p>
          </div>
          <div className="ct-stat-tile amber">
            <p className="ct-stat-label">{t("family.command.emergency")}</p>
            <p className="ct-stat-value ct-numeral">{emergencyPct != null ? `${emergencyPct}%` : "—"}</p>
          </div>
          {dependency.incomeConcentrationPct != null ? (
            <div className="ct-stat-tile indigo">
              <p className="ct-stat-label">
                {t("family.command.incomeShare")}
                <InfoTip textKey="family.command.incomeShareHint" />
              </p>
              <p className="ct-stat-value ct-numeral">{dependency.incomeConcentrationPct}%</p>
            </div>
          ) : null}
        </div>

        {roomId ? (
          <div className="ct-household-hub-room ct-stack-sm">
            <div className="ct-row-between gap-2 flex-wrap items-center">
              <Heading level={4} className="!text-sm">
                {t("household.commandHub.roomSection")}
                <InfoTip textKey="household.hub.privacyNote" />
              </Heading>
              {syncing ? <Caption>{t("common.loading")}</Caption> : null}
            </div>

            {isOwner && settings.householdInviteCode ? (
              <div className="ct-stat-tile indigo ct-stack-sm" data-guide="room-invite-code">
                <p className="ct-stat-label">
                  {t("household.hub.inviteCode")}
                  <InfoTip textKey="household.hub.inviteHint" />
                </p>
                <p className="ct-stat-value ct-numeral tracking-widest">{settings.householdInviteCode}</p>
              </div>
            ) : null}

            {members.length === 0 ? (
              <Caption>{t("household.hub.membersEmpty")}</Caption>
            ) : (
              members.map((m) => (
                <div key={m.userId} className="ct-row-between gap-2 py-1.5 border-b border-[var(--ct-border)] last:border-0">
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

            <div className="ct-row gap-2 flex-wrap pt-1" data-guide="room-share-toggle">
              <label className="ct-row gap-2 items-center text-sm">
                <input
                  type="checkbox"
                  checked={settings.householdShareSpends !== false}
                  onChange={(e) => updateSettings({ householdShareSpends: e.target.checked })}
                />
                {t("household.hub.shareMySpends")}
              </label>
              {isOwner ? (
                <label className="ct-row gap-2 items-center text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.householdShareBillDetail)}
                    onChange={(e) => updateSettings({ householdShareBillDetail: e.target.checked })}
                  />
                  {t("household.hub.shareBillDetail")}
                </label>
              ) : null}
            </div>
          </div>
        ) : null}

        {(forecast.heavyMonths?.length > 0 || sharedGoals.length > 0 || insights.length > 0) && (
          <div className="ct-household-hub-outlook ct-stack-sm" data-guide="household-outlook">
            <Caption className="block font-semibold">{t("household.commandHub.outlookSection")}</Caption>

            {forecast.heavyMonths?.length > 0 && (
              <div className="ct-stack-sm">
                <Caption className="block font-semibold opacity-90">{t("family.command.riskyMonths")}</Caption>
                {forecast.heavyMonths.slice(0, 2).map((m) => (
                  <Caption key={m.monthKey} className="block ct-numeral">
                    {m.label} · {formatInr(Math.round(m.amount))}
                  </Caption>
                ))}
              </div>
            )}

            {sharedGoals.length > 0 && (
              <div className="ct-stack-sm">
                <Caption className="block font-semibold opacity-90">{t("family.command.sharedGoals")}</Caption>
                {sharedGoals.slice(0, 2).map((g) => (
                  <Caption key={g.id} className="block truncate">
                    {g.label || g.name}
                  </Caption>
                ))}
              </div>
            )}

            {insights.length > 0 && (
              <ul className="ct-stack-sm">
                {insights.slice(0, 4).map((ins) => (
                  <li
                    key={ins.id}
                    className={`text-xs rounded-xl px-3 py-2 border ${insightToneClass(ins.tone || "info")}`}
                  >
                    {translateInsight(t, ins)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        </div>
      </div>

      <HouseholdSetupModal open={setupOpen} onClose={() => setSetupOpen(false)} />
      <HouseholdDependentsEditorModal open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
