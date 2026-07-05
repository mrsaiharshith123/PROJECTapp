import { useTranslation } from "../../../i18n/I18nProvider.js";
import { EditorialMastheadRight } from "../../patterns/EditorialMastheadRight.jsx";

/** Editorial masthead — brand, date, bell + profile. */
export default function HomeEditorialHeader({ tier }) {
  const { t } = useTranslation();

  return (
    <header className="ed-masthead">
      <div className="ed-masthead-top">
        <div className="ed-masthead-brand">
          <div className="ed-title">{t("brand.appName")}</div>
          <div className="ed-tagline">{t("home.ed.tagline")}</div>
        </div>
        <EditorialMastheadRight tier={tier} />
      </div>
    </header>
  );
}
