import { useState } from "react";
import { useTranslation } from "../../../../i18n/I18nProvider.js";
import { Body, Caption, Button, Modal, inputClassName } from "../../../index.js";
import { CtIcon } from "../../../icons/CtIcon.jsx";
import ProfileBrandFooter from "../ProfileBrandFooter.jsx";

/**
 * @param {{
 *   isLoggedIn?: boolean,
 *   signingOut?: boolean,
 *   onSignOut?: () => void | Promise<void>,
 *   onDeleteData?: () => void,
 *   deleting?: boolean,
 *   deleteError?: string,
 *   confirmDeleteOpen?: boolean,
 *   onCloseDelete?: () => void,
 *   deleteConfirmValue?: string,
 *   onDeleteConfirmChange?: (v: string) => void,
 *   onConfirmDelete?: () => void,
 *   userHasCloud?: boolean,
 * }} props
 */
export default function ProfileHubFooter({
  isLoggedIn = false,
  signingOut = false,
  onSignOut,
  onDeleteData,
  deleting = false,
  deleteError = "",
  confirmDeleteOpen = false,
  onCloseDelete,
  deleteConfirmValue = "",
  onDeleteConfirmChange,
  onConfirmDelete,
  userHasCloud = false,
}) {
  const { t } = useTranslation();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <footer className="ct-profile-hub-footer ct-reveal ct-reveal-delay-4">
      {isLoggedIn ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={signingOut}
            onClick={() => setConfirmSignOut(true)}
          >
            <CtIcon name="sign-out" size={16} />
            {signingOut ? t("profileHub.signingOut") : t("settings.row.signOut")}
          </Button>

          {confirmSignOut ? (
            <Modal title={t("profileHub.signOutTitle")} onClose={() => !signingOut && setConfirmSignOut(false)}>
              <div className="ct-stack-sm">
                <Body className="!text-sm">{t("profileHub.signOutBody")}</Body>
                <div className="ct-row">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmSignOut(false)} disabled={signingOut}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={signingOut}
                    onClick={async () => {
                      await onSignOut?.();
                      setConfirmSignOut(false);
                    }}
                  >
                    {t("settings.row.signOut")}
                  </Button>
                </div>
              </div>
            </Modal>
          ) : null}
        </>
      ) : null}

      <button type="button" className="ct-danger-text-link" onClick={onDeleteData}>
        {t("profileHub.deleteDataLink")}
      </button>

      {confirmDeleteOpen ? (
        <Modal title={t("backup.deleteModalTitle")} onClose={() => !deleting && onCloseDelete?.()}>
          <div className="ct-stack-sm">
            <Body className="!text-sm">
              {t("backup.deleteModalBody", {
                cloud: userHasCloud ? t("backup.deleteCloudModal") : t("backup.deleteSignout"),
              })}
            </Body>
            <Caption className="block">{t("profileHub.deleteTypePrompt")}</Caption>
            <input
              className={`${inputClassName()} ct-input-tint`}
              value={deleteConfirmValue}
              onChange={(e) => onDeleteConfirmChange?.(e.target.value)}
              placeholder={t("profileHub.deleteConfirmWord")}
              autoComplete="off"
            />
            {deleteError ? <Caption className="block text-[var(--ct-danger)]">{deleteError}</Caption> : null}
            <div className="ct-row">
              <Button type="button" variant="outline" className="flex-1" onClick={onCloseDelete} disabled={deleting}>
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                onClick={onConfirmDelete}
                disabled={deleting || deleteConfirmValue !== t("profileHub.deleteConfirmWord")}
              >
                {deleting ? t("common.deleting") : t("backup.deleteConfirm")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      <div className="ct-stat-tile !bg-transparent !border-0 !shadow-none">
        <Caption className="text-center block pb-1 opacity-75">{t("profile.savedLocally")}</Caption>
      </div>
      <ProfileBrandFooter />
    </footer>
  );
}
