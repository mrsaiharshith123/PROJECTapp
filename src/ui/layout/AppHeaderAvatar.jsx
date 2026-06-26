import { useState } from "react";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { resolveProfileAvatar } from "../../constants/profileAvatars.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import ProfileGlimpseMenu from "./ProfileGlimpseMenu.jsx";

export function AppHeaderAvatar() {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const { imageUrl, initials } = resolveProfileAvatar(settings);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("nav.you")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`ct-app-header-avatar${open ? " open" : ""}`}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          overflow: "hidden",
          flexShrink: 0,
          cursor: "pointer",
          padding: 0,
          border: open ? "2px solid rgba(99,102,241,0.65)" : "2px solid rgba(99,102,241,0.3)",
          background: imageUrl ? "transparent" : "linear-gradient(135deg,#6366f1,#4f46e5)",
        }}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {initials}
          </span>
        )}
      </button>
      <ProfileGlimpseMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default AppHeaderAvatar;
