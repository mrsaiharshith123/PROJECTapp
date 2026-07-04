import { useState, useCallback } from "react";
import { applyAppUpdate, checkForAppUpdate } from "../services/appUpdate.js";
import { openCachedApkInstall } from "../services/nativeApkUpdate.js";

export function useAppUpdateAction() {
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(null);
  const [checkResult, setCheckResult] = useState(null);

  const check = useCallback(async () => {
    setPhase("checking");
    setProgress(null);
    setCheckResult(null);
    try {
      const result = await checkForAppUpdate();
      setCheckResult(result);
      if (result.status === "current") {
        setPhase("current");
      } else if (result.status === "apk_ready") {
        setPhase("apk_ready");
      } else if (result.status === "available") {
        setPhase("downloading");
        const applyResult = await applyAppUpdate({
          allowApk: true,
          onProgress: (p) => setProgress(p),
        });
        if (applyResult.kind === "apk_downloaded") {
          setPhase("apk_ready");
        }
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  }, []);

  const installApk = useCallback(async () => {
    if (!checkResult?.remoteVersion) return;
    setPhase("downloading");
    try {
      await openCachedApkInstall(checkResult.remoteVersion);
    } catch {
      setPhase("error");
    }
  }, [checkResult]);

  return { phase, progress, checkResult, check, installApk };
}
