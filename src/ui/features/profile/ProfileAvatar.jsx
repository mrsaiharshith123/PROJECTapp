import { useRef } from "react";
import { Button, Caption } from "../../index.js";
import { resolveProfileAvatar } from "../../../constants/profileAvatars.js";
import { useTranslation } from "../../../i18n/I18nProvider.jsx";

const MAX_IMAGE_BYTES = 400_000;

/**
 * @param {{ settings: object, updateSettings: (p: object) => void, size?: 'sm' | 'lg', compact?: boolean }} props
 */
export default function ProfileAvatar({ settings, updateSettings, size = "lg", compact = false }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const { style, imageUrl, isUploaded } = resolveProfileAvatar(settings);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) {
      alert(t("avatar.imageTooLarge"));
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({
        avatarSource: "upload",
        profileImageDataUrl: String(reader.result || ""),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const useCartoon = () => {
    updateSettings({ avatarSource: "auto", profileImageDataUrl: "" });
  };

  const avatarSize = size === "sm" || compact ? "ct-avatar-sm" : "ct-avatar-lg";

  const avatarNode = (
    <div className={`ct-avatar ${avatarSize} bg-gradient-to-br ${style.gradient}`}>
      {imageUrl ? (
        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="select-none" role="img" aria-label={style.label}>
          {style.character}
        </span>
      )}
    </div>
  );

  if (compact) {
    return avatarNode;
  }

  return (
    <div className="ct-stack-sm items-center">
      {avatarNode}
      <Caption className="text-center">
        {isUploaded ? t("avatar.yourPhoto") : t("avatar.cartoonAvatar", { label: style.label })}
      </Caption>
      <div className="ct-row" style={{ flexWrap: "wrap", justifyContent: "center" }}>
        <Button type="button" size="sm" variant="primary" onClick={() => fileRef.current?.click()}>
          {t("avatar.uploadPhoto")}
        </Button>
        {isUploaded && (
          <Button type="button" size="sm" variant="outline" onClick={useCartoon}>
            {t("avatar.useCartoon")}
          </Button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
