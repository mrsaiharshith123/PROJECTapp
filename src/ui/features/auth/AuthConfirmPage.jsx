import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
import { LoadingSpinner } from "../../patterns/Loading.jsx";
import { Body, Heading } from "../../primitives/Text.jsx";
import { getSupabaseClient } from "../../../services/supabase/auth.js";
import { formatAuthError } from "../../../utils/authErrors.js";

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

/** Route: /auth/confirm — Supabase email verification callback. */
export default function AuthConfirmPage() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(/** @type {"processing"|"success"|"error"} */ ("processing"));
  const [detail, setDetail] = useState("");

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
      setPhase("error");
      setDetail(t("auth.confirmErrorBody"));
      return undefined;
    }

    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setPhase("success");
      }
    });

    if (params.hasToken || params.hasCode) {
      supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
          setDetail(formatAuthError(error));
          setPhase("error");
          return;
        }
        if (data.session) setPhase("success");
      });
    }

    return () => sub.data.subscription.unsubscribe();
  }, [t]);

  return (
    <div
      className="ed-page-full"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        paddingTop: "calc(24px + env(safe-area-inset-top, 0px))",
      }}
    >
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "var(--ed-font-serif)",
            fontStyle: "italic",
            fontSize: 32,
            fontWeight: 700,
            color: "var(--ed-gold)",
          }}
        >
          {t("brand.appName")}
        </div>
      </div>

      <div className="ed-card" style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 12 }}>
          {phase === "processing" && (
            <>
              <LoadingSpinner size="md" showLogo />
              <Heading level={2} style={{ textAlign: "center", fontSize: "1.125rem", fontWeight: 600 }}>
                {t("auth.confirmProcessingTitle")}
              </Heading>
              <Body style={{ textAlign: "center", color: "var(--ed-ink-soft)" }}>{t("auth.confirmProcessingBody")}</Body>
            </>
          )}

          {phase === "success" && (
            <>
              <span
                className="ed-auth-confirm-icon ed-auth-confirm-icon-success"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "var(--ed-green-soft)",
                  color: "var(--ed-green)",
                }}
                aria-hidden
              >
                <CtIcon name="check" size={32} weight="bold" />
              </span>
              <Heading level={2} style={{ textAlign: "center", fontSize: "1.125rem", fontWeight: 600 }}>
                {t("auth.confirmSuccessTitle")}
              </Heading>
              <Body style={{ textAlign: "center", color: "var(--ed-ink-soft)" }}>{t("auth.confirmSuccessBody")}</Body>
              <Link to="/" className="ed-btn ed-btn-primary ed-btn-block">
                {t("auth.confirmContinueApp")}
              </Link>
            </>
          )}

          {phase === "error" && (
            <>
              <span
                className="ed-auth-confirm-icon ed-auth-confirm-icon-error"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "var(--ed-red-soft)",
                  color: "var(--ed-red)",
                }}
                aria-hidden
              >
                <CtIcon name="warning" size={32} weight="duotone" />
              </span>
              <Heading level={2} style={{ textAlign: "center", fontSize: "1.125rem", fontWeight: 600 }}>
                {t("auth.confirmErrorTitle")}
              </Heading>
              <Body style={{ textAlign: "center", color: "var(--ed-ink-soft)" }}>{detail || t("auth.confirmErrorBody")}</Body>
              <Link to="/" className="ed-btn ed-btn-secondary ed-btn-block">
                {t("auth.confirmBackHome")}
              </Link>
            </>
          )}
      </div>
    </div>
  );
}
