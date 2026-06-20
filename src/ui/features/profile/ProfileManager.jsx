import { useState } from "react";
import { Button, Caption, inputClassName } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { tierHasFeature } from "../../../utils/tierAccess.js";
import { TierLimitBanner } from "../../patterns/TierLimitBanner.jsx";

const COLORS = ["indigo", "violet", "emerald", "amber", "rose", "sky"];

const COLOR_HEX = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  emerald: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  sky: "#0ea5e9",
};

const profileInputClass = inputClassName();

export default function ProfileManager() {
  const { t } = useTranslation();
  const { settings, updateSettings } = usePerovo();
  const defaultProfile = { id: "default", label: t("profile.defaultProfileLabel"), color: "indigo" };
  const profiles = settings.profiles || [defaultProfile];
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("indigo");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const saveProfiles = (next) => updateSettings({ profiles: next });

  const canAddProfile = tierHasFeature("multiple_profiles", settings);

  const addProfile = () => {
    const label = newLabel.trim();
    if (!label || !canAddProfile) return;
    const id = `p-${Date.now()}`;
    saveProfiles([...profiles, { id, label, color: newColor }]);
    setNewLabel("");
  };

  const startRename = (p) => {
    setEditingId(p.id);
    setEditLabel(p.label);
  };

  const commitRename = () => {
    if (!editingId || editingId === "default") {
      setEditingId(null);
      return;
    }
    const label = editLabel.trim();
    if (!label) return;
    saveProfiles(profiles.map((p) => (p.id === editingId ? { ...p, label } : p)));
    setEditingId(null);
  };

  const removeProfile = (id) => {
    if (id === "default") return;
    const next = profiles.filter((p) => p.id !== id);
    saveProfiles(next.length ? next : [defaultProfile]);
    if (settings.activeProfileId === id) updateSettings({ activeProfileId: "default" });
  };

  return (
    <div className="ct-stack-sm">
      <Caption className="font-semibold block">{t("profile.profilesTitle")}</Caption>
      <ul className="ct-stack-sm">
        {profiles.map((p) => (
          <li key={p.id} className="ct-hero-inset ct-row flex-wrap items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: COLOR_HEX[p.color] || COLOR_HEX.indigo }}
            />
            {editingId === p.id ? (
              <input
                className={`${profileInputClass} flex-1 min-w-0 !py-1.5 !text-sm`}
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={commitRename}
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-[var(--ct-text)]">{p.label}</span>
            )}
            {p.id !== "default" && editingId !== p.id && (
              <>
                <button type="button" onClick={() => startRename(p)} className="ct-link !text-xs">
                  {t("profile.rename")}
                </button>
                <button type="button" onClick={() => removeProfile(p.id)} className="ct-link !text-xs text-[var(--ct-danger-text)]">
                  {t("common.delete")}
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {!canAddProfile && profiles.length <= 1 && (
        <TierLimitBanner title={t("tier.limit.profilesTitle")} message={t("tier.limit.profilesMessage")} />
      )}
      <div className="ct-row flex-wrap gap-2">
        <input
          className={`${profileInputClass} flex-1 min-w-0 !text-sm`}
          placeholder={t("profile.newProfileName")}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <select
          className={`${profileInputClass} !w-auto !text-sm`}
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        >
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {t(`profile.color.${c}`)}
            </option>
          ))}
        </select>
        <Button type="button" size="sm" onClick={addProfile} disabled={!canAddProfile} className="!w-auto">
          {t("common.add")}
        </Button>
      </div>
      <select
        className={profileInputClass}
        value={settings.activeProfileId || "default"}
        onChange={(e) => updateSettings({ activeProfileId: e.target.value })}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <Caption className="block opacity-80">{t("profile.newBillsHint")}</Caption>
    </div>
  );
}
