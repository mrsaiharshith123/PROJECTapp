import { getUserModeConfig } from "./userModes.js";

/** Default avatar icon per user mode (on themed gradient). */
export const MODE_AVATAR_STYLES = {
  salaried: {
    gradient: "from-slate-600 to-indigo-700",
    icon: "briefcase",
    label: "Salaried pro",
  },
  family: {
    gradient: "from-emerald-500 to-teal-600",
    icon: "users-three",
    label: "Family",
  },
  power: {
    gradient: "from-gray-800 to-indigo-900",
    icon: "user-circle",
    label: "Power user",
  },
};

export function getModeAvatarStyle(modeId) {
  return MODE_AVATAR_STYLES[modeId] || MODE_AVATAR_STYLES.salaried;
}

/** First letter(s) from the user's display name — never the mode label. */
export function getProfileInitials(settings) {
  const name = settings?.displayName?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0][0]?.toUpperCase() || "?";
}

export function resolveProfileAvatar(settings) {
  const mode = getUserModeConfig(settings.userMode || "salaried");
  const style = getModeAvatarStyle(mode.id);
  const uploaded =
    settings.avatarSource === "upload" && settings.profileImageDataUrl
      ? settings.profileImageDataUrl
      : null;
  return {
    mode,
    style,
    imageUrl: uploaded,
    isUploaded: Boolean(uploaded),
    displayLabel: settings.displayName?.trim() || mode.label,
    initials: getProfileInitials(settings),
  };
}
