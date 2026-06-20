import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { isNativeCapacitorShell, requestNativePermission } from "./nativePermissions.js";

/**
 * @param {string} uri
 * @param {string} [fileName]
 * @returns {Promise<File>}
 */
async function uriToFile(uri, fileName = "bill.jpg") {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

/**
 * @param {"camera"|"gallery"} source
 * @returns {Promise<File | null>} null when caller should fall back to file input
 */
export async function pickBillImageNative(source) {
  if (!isNativeCapacitorShell()) return null;

  const permKind = source === "camera" ? "camera" : "photos";
  const perm = await requestNativePermission(permKind);
  if (perm !== "granted") {
    throw new Error("permission_denied");
  }

  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
  });

  const uri = photo.webPath || photo.path;
  if (!uri) throw new Error("no_image");
  return uriToFile(uri, `bill-${Date.now()}.jpg`);
}

export { isNativeCapacitorShell };
