import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { brandIconForTheme } from "../../brand/brandAssets.js";
import { assetUrl } from "../../../utils/basePath.js";
import { useDocumentTheme } from "../../../hooks/useDocumentTheme.js";
import MarketingThemeSync from "../../../app/MarketingThemeSync.jsx";
import { LandingBrandLockup } from "../../brand/LandingBrandLockup.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { Body, Caption, Heading } from "../../primitives/Text.jsx";

const FEATURES = [
  { key: "score", icon: "chart-line-up" },
  { key: "bills", icon: "wallet" },
  { key: "lending", icon: "handshake" },
  { key: "local", icon: "shield" },
  { key: "languages", icon: "book-open" },
  { key: "insights", icon: "chart-bar" },
];

const STATS = ["languages", "pillars", "offline"];

function apkDownloadUrl() {
  const configured = import.meta.env.VITE_APK_DOWNLOAD_URL;
  if (configured) return configured;
  return "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest/download/Perovo-dev-latest.apk";
}

export default function WebLandingPage() {
  const { t } = useTranslation();
  const theme = useDocumentTheme();
  const downloadUrl = apkDownloadUrl();
  const favicon = assetUrl(`brand/${brandIconForTheme(theme)}`);

  useEffect(() => {
    document.title = t("brand.appName");
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.setAttribute("href", favicon);
  }, [t, favicon]);

  return (
    <div className="ct-screen ct-landing">
      <MarketingThemeSync />
      <div className="ct-landing-ambient" aria-hidden>
        <div className="ct-landing-orb ct-landing-orb-a" />
        <div className="ct-landing-orb ct-landing-orb-b" />
        <div className="ct-landing-grid" />
      </div>

      <div className="ct-landing-inner">
        <header className="ct-landing-hero">
          <LandingBrandLockup />
          <span className="ct-landing-badge">{t("webLanding.heroBadge")}</span>
          <h1 className="ct-landing-display">{t("webLanding.heroTitle")}</h1>
          <Body className="ct-landing-lede">{t("webLanding.lede")}</Body>

          <div className="ct-landing-hero-cta">
            <a href={downloadUrl} download className="ct-btn ct-btn-primary ct-btn-lg ct-landing-cta-primary">
              {t("webLanding.downloadButton")}
            </a>
            <a href="#features" className="ct-btn ct-btn-outline ct-btn-lg">
              {t("webLanding.ctaFeatures")}
            </a>
          </div>

          <ul className="ct-landing-stats">
            {STATS.map((id) => (
              <li key={id} className="ct-landing-stat">
                <span className="ct-landing-stat-value">{t(`webLanding.stat.${id}.value`)}</span>
                <span className="ct-landing-stat-label">{t(`webLanding.stat.${id}.label`)}</span>
              </li>
            ))}
          </ul>
        </header>

        <section id="features" className="ct-landing-section" aria-labelledby="landing-features">
          <Heading level={2} id="landing-features" className="ct-landing-section-title">
            {t("webLanding.featuresTitle")}
          </Heading>
          <ul className="ct-landing-feature-grid">
            {FEATURES.map(({ key, icon }) => (
              <li key={key} className="ct-landing-feature-tile">
                <span className="ct-landing-feature-icon" aria-hidden>
                  <CtIcon name={icon} size={22} weight="duotone" />
                </span>
                <Heading level={2} className="ct-landing-feature-title">
                  {t(`webLanding.feature.${key}.title`)}
                </Heading>
                <Body className="ct-landing-feature-desc">{t(`webLanding.feature.${key}.desc`)}</Body>
              </li>
            ))}
          </ul>
        </section>

        <section className="ct-landing-cta-panel" aria-labelledby="landing-download">
          <div className="ct-landing-cta-glow" aria-hidden />
          <Heading level={2} id="landing-download" className="ct-landing-cta-title">
            {t("webLanding.downloadTitle")}
          </Heading>
          <Body className="ct-landing-cta-body">{t("webLanding.downloadBody")}</Body>
          <a href={downloadUrl} download className="ct-btn ct-btn-primary ct-btn-lg ct-landing-cta-primary">
            {t("webLanding.downloadButton")}
          </a>
          <Caption className="ct-landing-cta-hint">{t("webLanding.downloadHint")}</Caption>
        </section>

        <footer className="ct-landing-footer">
          <Caption>{t("webLanding.footerNote")}</Caption>
          <Link to="/privacy" className="ct-landing-link">
            {t("privacy.title")}
          </Link>
          <Caption className="block mt-2">{t("brand.byTadsaya")}</Caption>
        </footer>
      </div>
    </div>
  );
}
