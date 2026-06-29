import { useEffect, useRef, useState } from "react";
import { Body, Button, Caption, Modal } from "../ui/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import { usePerovo } from "../context/PerovoContext.jsx";
import { useTranslation } from "../i18n/I18nProvider.js";
import { fetchRemoteBackupMeta, isCloudSyncConfigured, pullRemoteSnapshotToLocal } from "../services/sync/syncEngine.js";
import { localStateHasUserData } from "../storage/snapshotData.js";
import { loadFullAppStateForSync } from "../utils/migrateStorage.js";

const DISMISS_KEY = "perovo_restore_offer_dismissed";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

/**
 * After sign-in on an empty device, offer the latest cloud backup before the main app.
 * Skipping starts fresh for this session; restoring reloads with imported data.
 */
export default function CloudRestoreGate({ children }) {
  const { t } = useTranslation();
  const { user, isLoggedIn } = useAuth();
  const track = usePerovo();
  const importAppDataRef = useRef(track.importAppData);
  const [offerOpen, setOfferOpen] = useState(false);
  const [remoteMeta, setRemoteMeta] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    importAppDataRef.current = track.importAppData;
  }, [track.importAppData]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id || !isCloudSyncConfigured()) {
      setOfferOpen(false);
      return;
    }

    if (sessionStorage.getItem(DISMISS_KEY) === user.id) {
      setOfferOpen(false);
      return;
    }

    let cancelled = false;
    try {
      const local = loadFullAppStateForSync();
      if (localStateHasUserData(local)) {
        setOfferOpen(false);
        return;
      }
    } catch {
      setOfferOpen(false);
      return;
    }

    fetchRemoteBackupMeta(user.id)
      .then((meta) => {
        if (cancelled) return;
        if (meta?.hasData) {
          setRemoteMeta(meta);
          setOfferOpen(true);
        } else {
          setOfferOpen(false);
        }
      })
      .catch(() => {
        if (!cancelled) setOfferOpen(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, user?.id]);

  const dismiss = () => {
    if (user?.id) sessionStorage.setItem(DISMISS_KEY, user.id);
    setOfferOpen(false);
  };

  const restore = async () => {
    if (!user?.id) return;
    setBusy(true);
    setError("");
    try {
      const result = await pullRemoteSnapshotToLocal({
        userId: user.id,
        getState: loadFullAppStateForSync,
        applySnapshot: (payload, options) => importAppDataRef.current(payload, options),
        force: true,
      });
      if (result.ok) {
        sessionStorage.removeItem(DISMISS_KEY);
        window.location.reload();
        return;
      }
      setError(t("sync.restoreOfferFailed"));
    } catch {
      setError(t("sync.restoreOfferFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {children}
      {offerOpen && remoteMeta ? (
        <Modal onClose={dismiss} title={t("sync.restoreOfferTitle")}>
          <div className="ct-stack-sm">
            <Body className="!text-sm">{t("sync.restoreOfferBody")}</Body>
            <Caption className="block">
              {t("sync.restoreOfferMeta", {
                when: formatWhen(remoteMeta.updatedAt),
                device: remoteMeta.deviceId || t("sync.unknownDevice"),
                bills: remoteMeta.counts.bills,
                lending: remoteMeta.counts.lending,
                wealth: remoteMeta.counts.wealth ?? 0,
              })}
            </Caption>
            {error ? <Caption className="block text-[var(--ct-danger)]">{error}</Caption> : null}
            <div className="ct-grid-2 gap-2">
              <Button type="button" variant="primary" size="sm" disabled={busy} onClick={restore}>
                {busy ? t("sync.working") : t("sync.restoreOfferRestore")}
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={busy} onClick={dismiss}>
                {t("sync.restoreOfferSkip")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
