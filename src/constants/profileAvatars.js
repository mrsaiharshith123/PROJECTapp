import { getUserModeConfig } from "./userModes.js";

/** Cartoon-style avatar per user mode (large emoji on themed gradient). */
export const MODE_AVATAR_STYLES = {
  salaried: {
    gradient: "from-slate-600 to-indigo-700",
    character: "👨‍💼",
    label: "Salaried pro",
  },
  family: {
    gradient: "from-emerald-500 to-teal-600",
    character: "👨‍👩‍👧",
    label: "Family",
  },
  power: {
    gradient: "from-gray-800 to-indigo-900",
    character: "🦸",
    label: "Power user",
  },
};

export function getModeAvatarStyle(modeId) {
  return MODE_AVATAR_STYLES[modeId] || MODE_AVATAR_STYLES.salaried;
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
  };
}
