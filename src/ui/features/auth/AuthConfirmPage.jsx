import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import MarketingThemeSync from "../../../app/MarketingThemeSync.jsx";
import { LandingBrandLockup } from "../../brand/LandingBrandLockup.jsx";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { LoadingSpinner } from "../../patterns/Loading.jsx";
import { Body, Caption, Heading } from "../../primitives/Text.jsx";
import { Card } from "../../primitives/Card.jsx";
import { getSupabaseClient } from "../../../services/supabase/auth.js";
import { isCustomerModeEnabled } from "../../../utils/embeddedApp.js";
import { formatAuthError } from "../../../utils/authErrors.js";
import AppDownloadSheet from "../AppDownloadSheet.jsx";

function parseAuthCallbackParams() {
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);
  const pick = (key) => hashParams.get(key) || queryParams.get(key);
  return {
    error: pick("error_description") || pick("error"),
    type: pick("type"),
    hasCode: queryParams.has("code"),
    hasToken: hashParams.has("access_token"),
  };
}

/**
 * Landing page after Supabase email verification (GitHub Pages + app builds).
 * Route: /auth/confirm — must stay registered in MarketingShell for production web.
 */
export default function AuthConfirmPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(/** @type {"processing"|"success"|"error"} */ ("processing"));
  const [detail, setDetail] = useState("");
  const [downloadOpen, setDownloadOpen] = useState(false);
  const marketing = isCustomerModeEnabled();

  useEffect(() => {
    document.title = t("auth.confirmPageTitle");

    const params = parseAuthCallbackParams();
    if (params.error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot auth callback error from URL
      setDetail(decodeURIComponent(String(params.error).replace(/\+/g, " ")));
      setPhase("error");
      return undefined;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setDetail(t("auth.errNotConfigured"));
      setPhase("error");
      return undefined;
    }

    let settled = false;
    const finish = (ok, message = "") => {
      if (settled) return;
      settled = true;
      setPhase(ok ? "success" : "error");
      if (message) setDetail(message);
      window.history.replaceState({}, "", window.location.pathname);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        finish(true);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          finish(false, formatAuthError(error));
          return;
        }
        if (data.session) {
          finish(true);
          return;
        }
        if (params.hasCode || params.hasToken || params.type === "signup" || params.type === "email") {
          window.setTimeout(() => {
            supabase.auth.getSession().then(({ data: retry }) => {
              if (retry.session) finish(true);
              else finish(true);
            });
          }, 1200);
          return;
        }
        window.setTimeout(() => finish(false, t("auth.confirmInvalidLink")), 4000);
      })
      .catch((e) => finish(false, formatAuthError(e)));

    return () => sub.subscription.unsubscribe();
  }, [t]);

  return (
    <div className="ct-screen ct-landing ct-auth-confirm">
      <MarketingThemeSync />
      <div className="ct-landing-ambient" aria-hidden>
        <div className="ct-landing-orb ct-landing-orb-a" />
        <div className="ct-landing-orb ct-landing-orb-b" />
      </div>

      <div className="ct-landing-inner ct-auth-confirm-inner">
        <LandingBrandLockup />

        <Card className="ct-auth-confirm-card ct-stack">
          {phase === "processing" && (
            <>
              <LoadingSpinner size="md" showLogo />
              <Heading level={2} className="ct-auth-confirm-title">
                {t("auth.confirmProcessingTitle")}
              </Heading>
              <Body className="ct-auth-confirm-body">{t("auth.confirmProcessingBody")}</Body>
            </>
          )}

          {phase === "success" && (
            <>
              <span className="ct-auth-confirm-icon ct-auth-confirm-icon-success" aria-hidden>
                <CtIcon name="check" size={32} weight="bold" />
              </span>
              <Heading level={2} className="ct-auth-confirm-title">
                {t("auth.confirmSuccessTitle")}
              </Heading>
              <Body className="ct-auth-confirm-body">{t("auth.confirmSuccessBody")}</Body>
              {marketing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDownloadOpen(true)}
                    className="ct-btn ct-btn-primary ct-btn-lg ct-landing-cta-primary"
                  >
                    {t("webLanding.downloadButton")}
                  </button>
                  <Caption className="ct-auth-confirm-hint">{t("auth.confirmOpenAppHint")}</Caption>
                </>
              ) : (
                <Link to="/" className="ct-btn ct-btn-primary ct-btn-lg">
                  {t("auth.confirmContinueApp")}
                </Link>
              )}
            </>
          )}

          {phase === "error" && (
            <>
              <span className="ct-auth-confirm-icon ct-auth-confirm-icon-error" aria-hidden>
                <CtIcon name="warning" size={32} weight="duotone" />
              </span>
              <Heading level={2} className="ct-auth-confirm-title">
                {t("auth.confirmErrorTitle")}
              </Heading>
              <Body className="ct-auth-confirm-body">{detail || t("auth.confirmErrorBody")}</Body>
              <Link to="/" className="ct-btn ct-btn-outline">
                {t("auth.confirmBackHome")}
              </Link>
            </>
          )}
        </Card>
      </div>
      <AppDownloadSheet open={downloadOpen} onClose={() => setDownloadOpen(false)} />
    </div>
  );
}
