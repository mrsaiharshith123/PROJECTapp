import { useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getProfileInitials } from "../../../constants/profileAvatars.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import ProfileGlimpseMenu from "../../layout/ProfileGlimpseMenu.jsx";

/** Editorial masthead profile — letter avatar with subtle tier ring. */
export default function HomeEditorialAvatar({ tier = "free" }) {
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const letter = getProfileInitials(settings).charAt(0) || "?";
  const [open, setOpen] = useState(false);

  const tierLabel =
    tier === "power" ? t("plans.tier.power") : tier === "pro" ? t("plans.tier.pro") : t("plans.tier.free");

  const tierClass =
    tier === "power" ? "ed-avatar--power" : tier === "pro" ? "ed-avatar--pro" : "ed-avatar--free";

  return (
    <>
      <button
        type="button"
        className={`ed-avatar ${tierClass}`}
        aria-label={t("profileHub.heroTierAria", { tier: tierLabel })}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {letter}
      </button>
      <ProfileGlimpseMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
