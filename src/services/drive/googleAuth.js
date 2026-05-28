const GIS_SRC = "https://accounts.google.com/gsi/client";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

let tokenClient = null;
let accessToken = null;

function ensureGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load Google auth script.")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google auth script."));
    document.head.appendChild(script);
  });
}

export function clearGoogleToken() {
  accessToken = null;
}

export async function getGoogleAccessToken() {
  if (accessToken) return accessToken;
  await ensureGisScript();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Missing VITE_GOOGLE_CLIENT_ID in .env.");
  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          throw new Error(response.error);
        }
        accessToken = response.access_token || null;
      },
    });
  }
  await new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }
      accessToken = response.access_token || null;
      resolve();
    };
    tokenClient.requestAccessToken({ prompt: "consent" });
  });
  if (!accessToken) throw new Error("Failed to get Google access token.");
  return accessToken;
}
