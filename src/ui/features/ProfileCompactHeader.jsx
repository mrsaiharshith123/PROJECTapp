import { getUserModeConfig } from "../../constants/userModes.js";
import { resolveUserMode, hasPowerFeatures, isSalariedFamily } from "../../constants/modeExperience.js";
import ProfileAvatar from "./profile/ProfileAvatar.jsx";
import { Caption } from "../primitives/Text.jsx";

/**
 * @param {{ settings: object, updateSettings: (p: object) => void }} props
 */
export function ProfileCompactHeader({ settings, updateSettings }) {
  const modeCfg = getUserModeConfig(resolveUserMode(settings));
  const salariedFamily = isSalariedFamily(settings);

  return (
    <div className="ct-profile-compact">
      <ProfileAvatar settings={settings} updateSettings={updateSettings} size="sm" compact />
      <div className="min-w-0 flex-1">
        <p className="ct-body-strong truncate">{settings.displayName?.trim() || "CommitTrack user"}</p>
        <Caption className="block truncate">
          {modeCfg.emoji} {modeCfg.label}
          {salariedFamily ? " · Family" : ""}
          {hasPowerFeatures(settings) ? " · Pro" : ""}
        </Caption>
      </div>
    </div>
  );
}

export default ProfileCompactHeader;
