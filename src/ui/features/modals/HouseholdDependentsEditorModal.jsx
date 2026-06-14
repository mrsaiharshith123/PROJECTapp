import { useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { householdMemberLimit } from "../../../engines/householdRoom.js";
import { updateLocalHouseholdMemberLimit } from "../../../engines/householdRoomLocal.js";
import { Modal, Button, Caption, Body, Stack } from "../../index.js";

function Stepper({ value, min, max, onChange, decreaseLabel, increaseLabel }) {
  return (
    <div className="ct-household-stepper">
      <button
        type="button"
        className="ct-btn ct-btn-outline ct-btn-sm"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={decreaseLabel}
      >
        −
      </button>
      <span className="ct-household-stepper-value ct-numeral">{value}</span>
      <button
        type="button"
        className="ct-btn ct-btn-outline ct-btn-sm"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={increaseLabel}
      >
        +
      </button>
    </div>
  );
}

/**
 * @param {{ settings: object, updateSettings: (p: object) => void, onClose: () => void }} props
 */
function HouseholdDependentsEditorForm({ settings, updateSettings, onClose }) {
  const { t } = useTranslation();
  const members = settings.householdRoomMembers || [];
  const isOwner = settings.householdRoomRole === "owner";
  const roomId = settings.householdRoomId || "";
  const memberFloor = Math.max(2, members.length);

  const [dependents, setDependents] = useState(Math.max(0, Number(settings.dependents) || 0));
  const [seatLimit, setSeatLimit] = useState(
    settings.householdMemberLimit || householdMemberLimit(settings) || memberFloor,
  );

  const save = () => {
    const deps = Math.max(0, Math.floor(dependents) || 0);
    const seats = Math.min(20, Math.max(memberFloor, Math.floor(seatLimit) || memberFloor));
    const patch = { dependents: deps, householdMemberLimit: seats };

    if (
      isOwner &&
      roomId &&
      (settings.householdRoomLocal || String(roomId).startsWith("local-"))
    ) {
      updateLocalHouseholdMemberLimit(roomId, seats);
    }

    updateSettings(patch);
    onClose();
  };

  return (
    <Modal title={t("household.edit.title")} onClose={onClose}>
      <Stack gap="md">
        <Caption className="block">{t("household.edit.subtitle")}</Caption>

        <div className="ct-stack-sm">
          <Body className="font-semibold">{t("household.edit.dependentsLabel")}</Body>
          <Caption className="block">{t("household.edit.dependentsHint")}</Caption>
          <Stepper
            value={dependents}
            min={0}
            max={99}
            onChange={setDependents}
            decreaseLabel={t("household.edit.decrease")}
            increaseLabel={t("household.edit.increase")}
          />
        </div>

        {isOwner && roomId ? (
          <div className="ct-stack-sm">
            <Body className="font-semibold">{t("household.edit.seatsLabel")}</Body>
            <Caption className="block">
              {t("household.edit.seatsHint", { joined: members.length })}
            </Caption>
            <Stepper
              value={seatLimit}
              min={memberFloor}
              max={20}
              onChange={setSeatLimit}
              decreaseLabel={t("household.edit.decrease")}
              increaseLabel={t("household.edit.increase")}
            />
          </div>
        ) : null}

        <div className="ct-row gap-2 flex-wrap pt-1">
          <Button type="button" variant="primary" onClick={save}>
            {t("common.save")}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}

/**
 * Edit household dependents and room seat limit (owner).
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function HouseholdDependentsEditorModal({ open, onClose }) {
  const { settings, updateSettings } = useCommitTrack();
  if (!open) return null;

  const members = settings.householdRoomMembers || [];
  const memberFloor = Math.max(2, members.length);
  const formKey = `${settings.dependents}|${settings.householdMemberLimit}|${memberFloor}|${settings.householdRoomId}`;

  return (
    <HouseholdDependentsEditorForm
      key={formKey}
      settings={settings}
      updateSettings={updateSettings}
      onClose={onClose}
    />
  );
}
