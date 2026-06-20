import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { assetUrl } from "../../../utils/basePath.js";
import { Body, Caption, Heading, Card, Stack } from "../../index.js";

const FEATURE_IDS = [
  "webLanding.feature.score",
  "webLanding.feature.bills",
  "webLanding.feature.lending",
  "webLanding.feature.local",
  "webLanding.feature.languages",
  "webLanding.feature.insights",
];

function apkDownloadUrl() {
  const configured = import.meta.env.VITE_APK_DOWNLOAD_URL;
  if (configured) return configured;
  return "https://github.com/mrsaiharshith123/PROJECTapp/releases/latest/download/Perovo-dev-latest.apk";
}

export default function WebLandingPage() {
  const { t } = useTranslation();
  const downloadUrl = apkDownloadUrl();
  const iconUrl = assetUrl("brand/icon-light-lg.png");
  const wordmarkUrl = assetUrl("brand/wordmark-light.png");

  useEffect(() => {
    document.title = t("brand.appName");
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.setAttribute("href", iconUrl);
  }, [t, iconUrl]);

  return (
    <div className="ct-screen ct-landing">
      <div className="ct-auth-ambient" aria-hidden>
        <div className="ct-auth-grid" />
        <div className="ct-auth-orb ct-auth-orb-a" />
        <div className="ct-auth-orb ct-auth-orb-b" />
        <div className="ct-auth-shine" />
      </div>

      <div className="ct-landing-inner">
        <header className="ct-landing-hero">
          <div className="ct-landing-logo-ring">
            <img
              src={iconUrl}
              alt={t("brand.appName")}
              width={96}
              height={96}
              className="ct-perovo-logo"
              draggable={false}
            />
          </div>
          <img
            src={wordmarkUrl}
            alt={t("brand.appName")}
            height={56}
            className="ct-perovo-wordmark ct-perovo-wordmark-lg ct-landing-brand"
            draggable={false}
          />
          <Heading level={1} className="ct-landing-headline">
            {t("brand.tagline")}
          </Heading>
          <Body className="ct-landing-lede">{t("webLanding.lede")}</Body>
        </header>

        <section className="ct-landing-section" aria-labelledby="landing-features">
          <Heading level={2} id="landing-features" className="ct-landing-section-title">
            {t("webLanding.featuresTitle")}
          </Heading>
          <ul className="ct-landing-features">
            {FEATURE_IDS.map((key) => (
              <li key={key}>
                <Card className="ct-landing-feature-card">
                  <Body>{t(key)}</Body>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <section className="ct-landing-section ct-landing-download" aria-labelledby="landing-download">
          <Heading level={2} id="landing-download" className="ct-landing-section-title">
            {t("webLanding.downloadTitle")}
          </Heading>
          <Body>{t("webLanding.downloadBody")}</Body>
          <Stack className="ct-landing-actions">
            <a href={downloadUrl} download className="ct-btn ct-btn-primary ct-btn-lg ct-landing-download-btn">
              {t("webLanding.downloadButton")}
            </a>
            <Caption>{t("webLanding.downloadHint")}</Caption>
          </Stack>
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
