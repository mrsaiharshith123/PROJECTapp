import Card from "../Card.jsx";
import ProfileManager from "./ProfileManager.jsx";
import { ProfileField, profileInputClass } from "./ProfileField.jsx";
import { isSalariedFamily } from "../../constants/modeExperience.js";

export default function ProfilePersonalSection({ settings, updateSettings }) {
  const salariedFamily = isSalariedFamily(settings);

  return (
    <Card className="space-y-4">
      <ProfileField label="Display name" hint="How we greet you on the dashboard.">
        <input
          className={profileInputClass}
          value={settings.displayName ?? ""}
          onChange={(e) => updateSettings({ displayName: e.target.value })}
          placeholder="Your name"
        />
      </ProfileField>
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Appearance</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "light", label: "Light" },
            { id: "dark", label: "Dark" },
            { id: "system", label: "System" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => updateSettings({ colorScheme: opt.id })}
              className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                (settings.colorScheme || "system") === opt.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200"
                  : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      {salariedFamily && (
        <div className="pt-2 border-t border-gray-100 dark:border-slate-700 space-y-2">
          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Family profiles</p>
          <p className="text-[11px] text-gray-500">Separate bills by family member or area of the home.</p>
          <ProfileManager />
        </div>
      )}
    </Card>
  );
}
