import { useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { createAdminBroadcast } from "../../../services/adminBroadcasts.js";

const BROADCAST_TYPES = ["app_update", "sale", "security", "feature", "tip", "maintenance"];
const TIERS = ["free", "pro"];

export default function AdminBroadcastComposer() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: "feature",
    title: "",
    body: "",
    route: "",
    targetFree: true,
    targetPro: true,
    active_until: "",
  });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState("");

  const send = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setBusy(true);
    setFlash("");
    try {
      const target_tiers = [];
      if (form.targetFree) target_tiers.push("free");
      if (form.targetPro) target_tiers.push("pro");
      await createAdminBroadcast({
        type: form.type,
        title: form.title,
        body: form.body,
        route: form.route || null,
        target_tiers: target_tiers.length === 2 ? null : target_tiers,
        active_until: form.active_until ? new Date(form.active_until).toISOString() : null,
        created_by: user?.id || null,
      });
      setForm({ type: "feature", title: "", body: "", route: "", targetFree: true, targetPro: true, active_until: "" });
      setFlash(t("admin.broadcasts.sent"));
      window.setTimeout(() => setFlash(""), 3000);
    } catch (e) {
      setFlash(e instanceof Error ? e.message : t("admin.broadcasts.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ed-admin-panel ed-stack-sm">
      <p className="ed-admin-panel-title">{t("admin.broadcasts.composerTitle")}</p>

      <div className="ed-admin-form-row">
        <label className="ed-admin-field-label">{t("admin.broadcasts.type")}</label>
        <select
          className="ed-select"
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
        >
          {BROADCAST_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`admin.broadcasts.type.${type}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="ed-admin-form-row">
        <label className="ed-admin-field-label">{t("admin.broadcasts.fieldTitle")}</label>
        <input
          className="ed-input"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder={t("admin.broadcasts.titlePlaceholder")}
        />
      </div>

      <div className="ed-admin-form-row">
        <label className="ed-admin-field-label">{t("admin.broadcasts.fieldBody")}</label>
        <textarea
          className="ed-input"
          rows={3}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder={t("admin.broadcasts.bodyPlaceholder")}
        />
      </div>

      <div className="ed-admin-form-row">
        <label className="ed-admin-field-label">{t("admin.broadcasts.fieldRoute")}</label>
        <input
          className="ed-input"
          value={form.route}
          onChange={(e) => setForm((f) => ({ ...f, route: e.target.value }))}
          placeholder="/you/plans"
        />
      </div>

      <div className="ed-admin-form-row">
        <label className="ed-admin-field-label">{t("admin.broadcasts.fieldUntil")}</label>
        <input
          type="datetime-local"
          className="ed-input"
          value={form.active_until}
          onChange={(e) => setForm((f) => ({ ...f, active_until: e.target.value }))}
        />
      </div>

      <div className="ed-admin-form-row">
        <span className="ed-admin-field-label">{t("admin.broadcasts.targetTiers")}</span>
        <div className="ed-row gap-4">
          {TIERS.map((tier) => (
            <label key={tier} className="ed-row gap-2" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={tier === "free" ? form.targetFree : form.targetPro}
                onChange={(e) =>
                  setForm((f) =>
                    tier === "free"
                      ? { ...f, targetFree: e.target.checked }
                      : { ...f, targetPro: e.target.checked },
                  )
                }
              />
              {t(`plans.tier.${tier}`)}
            </label>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="ed-btn ed-btn-primary"
        onClick={send}
        disabled={busy || !form.title.trim() || !form.body.trim()}
      >
        {busy ? t("admin.broadcasts.saving") : t("admin.broadcasts.publish")}
      </button>

      {flash ? (
        <p style={{ fontSize: 12, color: "var(--ed-green)", marginTop: 4 }}>{flash}</p>
      ) : null}
      {import.meta.env.DEV ? (
        <p className="ed-caption" style={{ color: "var(--ed-ink-faint)", marginTop: 4 }}>
          {t("admin.broadcasts.supabaseProject", {
            project:
              import.meta.env.VITE_SUPABASE_URL?.split(".")[0]?.split("//")[1] || "unknown",
          })}
        </p>
      ) : null}
    </div>
  );
}
