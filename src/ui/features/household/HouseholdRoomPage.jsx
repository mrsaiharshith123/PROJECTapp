import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  PageHeader,
  Button,
  Caption,
  Body,
  Heading,
  Badge,
  Stack,
  SectionLoader,
  InfoTip,
  CtIcon,
  CelebrationOverlay,
} from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { normalizeInviteCode } from "../../../engines/householdRoom.js";
import RoomChatPanel from "./RoomChatPanel.jsx";
import {
  createHouseholdRoom,
  joinHouseholdRoom,
  loadMyHouseholdRoom,
  leaveHouseholdRoom,
} from "../../../services/household/householdRoomService.js";

const MEMBER_LIMIT_OPTIONS = [2, 3, 4, 5, 6];

function applyRoomToSettings(updateSettings, result, dependents) {
  updateSettings({
    householdRoomId: result.roomId,
    householdInviteCode: result.inviteCode,
    householdRoomRole: result.role,
    householdRoomName: result.roomName,
    householdRoomMembers: result.members,
    householdRoomLocal: Boolean(result.local),
    householdMemberLimit: Number(result.memberLimit) || 2,
    dependents: dependents != null ? dependents : undefined,
    householdShareSpends: true,
    householdShareBillDetail: result.role === "owner",
    activeProfileId: "default",
  });
}

function clearRoomSettings(updateSettings) {
  updateSettings({
    householdRoomId: "",
    householdInviteCode: "",
    householdRoomRole: "",
    householdRoomName: "",
    householdRoomMembers: [],
    householdRoomLocal: false,
  });
}

export default function HouseholdRoomPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const { user, isLoggedIn } = useAuth();

  const canLoad = isLoggedIn && Boolean(user?.id);
  const [roomLoaded, setRoomLoaded] = useState(!isLoggedIn);
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [roomName, setRoomName] = useState(t("household.room.defaultName"));
  const [memberLimit, setMemberLimit] = useState(4);
  const [inviteCode, setInviteCode] = useState("");
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [joinCelebration, setJoinCelebration] = useState(false);
  const [roomTab, setRoomTab] = useState("activity");

  const isFamily = isSalariedFamily(settings);

  useEffect(() => {
    if (!isFamily) {
      navigate("/profile", { replace: true });
      return;
    }
    if (!canLoad) return;

    let cancelled = false;
    (async () => {
      setRoomLoaded(false);
      try {
        const localRoomId = settings.householdRoomId || "";
        const loaded = await loadMyHouseholdRoom(user.id, { localRoomId });
        if (cancelled) return;

        if (loaded) {
          setRoom(loaded);
          if (settings.householdRoomId !== loaded.roomId) {
            updateSettings({
              householdRoomId: loaded.roomId,
              householdInviteCode: loaded.inviteCode,
              householdRoomRole: loaded.role,
              householdRoomName: loaded.roomName,
              householdRoomMembers: loaded.members,
              householdMemberLimit: loaded.memberLimit,
              householdRoomLocal: loaded.local,
            });
          }
        } else if (localRoomId) {
          setRoom({
            roomId: localRoomId,
            inviteCode: settings.householdInviteCode,
            roomName: settings.householdRoomName || t("household.room.defaultName"),
            role: settings.householdRoomRole || "member",
            memberLimit: settings.householdMemberLimit || 2,
            members: settings.householdRoomMembers || [],
            local: Boolean(settings.householdRoomLocal),
          });
        } else {
          setRoom(null);
        }
      } catch {
        if (!cancelled) setRoom(null);
      } finally {
        if (!cancelled) setRoomLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally load once per sign-in — settings are read for hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFamily, canLoad, user?.id, navigate]);

  const mapError = (reason) => {
    const known = [
      "not_configured",
      "invalid_code",
      "code_not_found",
      "not_found",
      "create_failed",
      "migration_missing",
      "household_full",
    ];
    const key = reason === "not_found" ? "code_not_found" : reason;
    return known.includes(key)
      ? t(`household.room.error.${key}`)
      : t("household.room.error.generic");
  };

  const handleCreate = async () => {
    setError("");
    if (!isLoggedIn || !user?.id) {
      setError(t("household.room.signInRequired"));
      return;
    }
    setBusy(true);
    try {
      const displayName = settings.displayName?.trim() || t("household.room.you");
      const result = await createHouseholdRoom({
        userId: user.id,
        displayName,
        roomName,
        settings,
        memberLimit,
      });
      if (!result.ok) {
        setError(mapError(result.reason));
        return;
      }
      applyRoomToSettings(updateSettings, result, settings.dependents);
      setRoom({
        roomId: result.roomId,
        inviteCode: result.inviteCode,
        roomName: result.roomName,
        role: result.role,
        memberLimit: result.memberLimit,
        members: result.members,
        local: result.local,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!isLoggedIn || !user?.id) {
      setError(t("household.room.signInRequired"));
      return;
    }
    setBusy(true);
    try {
      const displayName = settings.displayName?.trim() || t("household.room.you");
      const result = await joinHouseholdRoom({
        userId: user.id,
        displayName,
        inviteCode: normalizeInviteCode(inviteCode),
        settings,
      });
      if (!result.ok) {
        setError(mapError(result.reason));
        return;
      }
      applyRoomToSettings(updateSettings, result);
      setRoom({
        roomId: result.roomId,
        inviteCode: result.inviteCode,
        roomName: result.roomName,
        role: result.role,
        memberLimit: result.memberLimit || settings.householdMemberLimit,
        members: result.members,
        local: result.local,
      });
      setJoinCelebration(true);
      setTimeout(() => setJoinCelebration(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async (code) => {
    const text = String(code || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleWhatsAppShare = (code) => {
    const msg = t("household.room.whatsappShare", {
      appName: t("brand.appName"),
      code,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const handleLeave = async () => {
    if (!user?.id || !room?.roomId) return;
    setBusy(true);
    try {
      await leaveHouseholdRoom({ userId: user.id, roomId: room.roomId });
      clearRoomSettings(updateSettings);
      setRoom(null);
      setLeaveConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  if (!isFamily) return null;

  const members = room?.members || [];
  const isOwner = room?.role === "owner";
  const limit = Number(room?.memberLimit) || settings.householdMemberLimit || 2;

  const showLoader = canLoad && !roomLoaded;

  return (
    <>
    <div className="ct-page">
      <PageHeader
        title={t("household.room.pageTitle")}
        eyebrow={t("mode.family")}
        subtitle={t("household.room.pageSubtitle")}
      />

      {showLoader ? (
        <SectionLoader message={t("common.loading")} />
      ) : !isLoggedIn ? (
        <Card>
          <Body>{t("household.room.signInRequired")}</Body>
          <Button type="button" variant="primary" className="mt-3" onClick={() => navigate("/auth")}>
            {t("auth.signInTitle")}
          </Button>
        </Card>
      ) : !room ? (
        <Stack gap="md">
          <Card>
            <Heading level={3} className="!text-base mb-2">
              {t("household.room.createCardTitle")}
            </Heading>
            <label className="ct-field-label">{t("household.room.nameLabel")}</label>
            <input
              className="ct-input w-full"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value.slice(0, 60))}
            />
            <label className="ct-field-label mt-3">{t("household.room.memberLimitLabel")}</label>
            <select
              className="ct-input w-full"
              value={memberLimit}
              onChange={(e) => setMemberLimit(Number(e.target.value))}
            >
              {MEMBER_LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {t("household.room.memberLimitOption", { count: n })}
                </option>
              ))}
            </select>
            <Button type="button" variant="primary" className="mt-3 w-full" disabled={busy} onClick={handleCreate}>
              {busy ? t("common.loading") : t("household.room.createCta")}
            </Button>
          </Card>

          <Card>
            <Heading level={3} className="!text-base mb-2">
              {t("household.room.joinCardTitle")}
            </Heading>
            <label className="ct-field-label">{t("household.room.codeLabel")}</label>
            <input
              className="ct-input w-full ct-numeral"
              value={inviteCode}
              onChange={(e) => setInviteCode(normalizeInviteCode(e.target.value))}
              placeholder={t("household.room.codePlaceholder")}
              maxLength={6}
            />
            <Button type="button" variant="outline" className="mt-3 w-full" disabled={busy} onClick={handleJoin}>
              {busy ? t("common.loading") : t("household.room.joinCta")}
            </Button>
          </Card>

          {error ? <Body className="ct-text-danger text-sm">{error}</Body> : null}
        </Stack>
      ) : (
        <Stack gap="md" className="ct-list-animate">
          <div className="ct-row gap-2" role="tablist">
            <Button
              type="button"
              variant={roomTab === "activity" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setRoomTab("activity")}
            >
              {t("household.room.tabActivity")}
            </Button>
            <Button
              type="button"
              variant={roomTab === "chat" ? "primary" : "ghost"}
              size="sm"
              onClick={() => setRoomTab("chat")}
            >
              {t("household.room.tabChat")}
            </Button>
          </div>

          {roomTab === "chat" ? (
            <Card>
              <RoomChatPanel />
            </Card>
          ) : (
            <>
          <Card className="ct-household-room-active">
            <div className="ct-row-between gap-2 flex-wrap items-start">
              <Heading level={3} className="!text-lg">
                {room.roomName || t("household.room.defaultName")}
              </Heading>
            </div>
            <Caption className="block mt-1">
              {t("household.room.memberCount", { count: members.length, limit })}
            </Caption>

            {isOwner && room.inviteCode ? (
              <div className="mt-4 ct-hero-card lending ct-household-invite-hero" data-guide="room-invite-code">
                <div className="ct-hero-glow" aria-hidden />
                <Caption className="block mb-2 font-semibold relative">
                  {t("household.room.shareCodeBanner")}
                  <InfoTip textKey="household.hub.inviteHint" />
                </Caption>
                <button
                  type="button"
                  className="ct-household-invite-pill ct-numeral"
                  onClick={() => handleCopyCode(room.inviteCode)}
                  aria-label={t("household.room.tapToCopy")}
                >
                  {room.inviteCode}
                </button>
                <Caption className="block mt-2">
                  {copied ? t("household.room.codeCopied") : t("household.room.tapToCopy")}
                </Caption>
                <Button
                  type="button"
                  variant="primary"
                  className="mt-3 w-full"
                  onClick={() => handleWhatsAppShare(room.inviteCode)}
                >
                  <span className="ct-row gap-2 items-center justify-center">
                    <CtIcon name="chat-circle" size={18} />
                    {t("household.room.shareWhatsapp")}
                  </span>
                </Button>
              </div>
            ) : null}
          </Card>

          <Card data-guide="room-members">
            <Heading level={3} className="!text-base mb-3">
              {t("household.hub.members")}
            </Heading>
            {members.length === 0 ? (
              <Caption>{t("household.hub.membersEmpty")}</Caption>
            ) : (
              <Stack gap="sm">
                {members.map((m) => (
                  <div key={m.userId} className="ct-row-between ct-list-row-static">
                    <Body className="font-semibold">{m.displayName || t("household.room.you")}</Body>
                    <Badge tone={m.role === "owner" ? "info" : "neutral"}>
                      {m.role === "owner" ? t("household.hub.roleOwner") : t("household.hub.roleMember")}
                    </Badge>
                  </div>
                ))}
              </Stack>
            )}
          </Card>

          <div className="pt-2">
            {!leaveConfirm ? (
              <Button type="button" variant="ghost" className="w-full ct-text-danger" onClick={() => setLeaveConfirm(true)}>
                {t("household.room.leaveRoom")}
              </Button>
            ) : (
              <Card>
                <Caption className="block mb-3">{t("household.room.leaveConfirm")}</Caption>
                <div className="ct-row gap-2">
                  <Button type="button" variant="danger" disabled={busy} onClick={handleLeave}>
                    {t("household.room.leaveCta")}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setLeaveConfirm(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </Card>
            )}
          </div>
            </>
          )}
        </Stack>
      )}
    </div>
    {joinCelebration ? (
      <CelebrationOverlay
        type="coins"
        show
        message={t("celebration.householdJoined")}
        onComplete={() => setJoinCelebration(false)}
      />
    ) : null}
    </>
  );
}
