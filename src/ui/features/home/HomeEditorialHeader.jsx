import { useTranslation } from "../../../i18n/I18nProvider.js";
import HomeEditorialAvatar from "./HomeEditorialAvatar.jsx";

/** Editorial masthead — brand, date, profile with merged tier ring. */
export default function HomeEditorialHeader({ tier }) {
  const { t } = useTranslation();
  const today = new Date();
  const dayName = today.toLocaleDateString("en-IN", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <header className="ed-masthead">
      <div className="ed-masthead-top">
        <div className="ed-masthead-brand">
          <div className="ed-title">{t("brand.appName")}</div>
          <div className="ed-tagline">{t("home.ed.tagline")}</div>
        </div>
        <div className="ed-masthead-right">
          <div className="ed-date">
            {dayName}
            <br />
            {dateStr}
          </div>
          <HomeEditorialAvatar tier={tier} />
        </div>
      </div>
    </header>
  );
}
