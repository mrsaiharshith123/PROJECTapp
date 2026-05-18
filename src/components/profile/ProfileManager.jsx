import { useState } from "react";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";

const COLORS = ["indigo", "violet", "emerald", "amber", "rose", "sky"];

export default function ProfileManager() {
  const { settings, updateSettings } = useCommitTrack();
  const profiles = settings.profiles || [{ id: "default", label: "Personal", color: "indigo" }];
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("indigo");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const saveProfiles = (next) => updateSettings({ profiles: next });

  const addProfile = () => {
    const label = newLabel.trim();
    if (!label) return;
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
    saveProfiles(next.length ? next : [{ id: "default", label: "Personal", color: "indigo" }]);
    if (settings.activeProfileId === id) updateSettings({ activeProfileId: "default" });
  };

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-700">
      <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">Profiles</p>
      <ul className="space-y-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-100 dark:border-slate-700 px-3 py-2"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full bg-${p.color}-500 shrink-0`}
              style={{
                backgroundColor:
                  p.color === "indigo"
                    ? "#6366f1"
                    : p.color === "violet"
                      ? "#8b5cf6"
                      : p.color === "emerald"
                        ? "#10b981"
                        : p.color === "amber"
                          ? "#f59e0b"
                          : p.color === "rose"
                            ? "#f43f5e"
                            : "#0ea5e9",
              }}
            />
            {editingId === p.id ? (
              <input
                className="flex-1 min-w-[120px] px-2 py-1 rounded-lg border border-gray-200 text-sm"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={commitRename}
              />
            ) : (
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-100">{p.label}</span>
            )}
            {p.id !== "default" && editingId !== p.id && (
              <>
                <button type="button" onClick={() => startRename(p)} className="text-xs text-indigo-600 font-semibold">
                  Rename
                </button>
                <button type="button" onClick={() => removeProfile(p.id)} className="text-xs text-red-500 font-semibold">
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 min-w-[140px] px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm"
          placeholder="New profile name"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <select
          className="px-2 py-2 rounded-xl border border-gray-200 text-sm"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
        >
          {COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button type="button" onClick={addProfile} className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
          Add
        </button>
      </div>
      <select
        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm"
        value={settings.activeProfileId || "default"}
        onChange={(e) => updateSettings({ activeProfileId: e.target.value })}
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-gray-400">New bills and goals use the active profile.</p>
    </div>
  );
}
