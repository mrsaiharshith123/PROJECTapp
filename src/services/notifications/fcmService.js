import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { isNativeCapacitorShell } from "../../utils/nativePermissions.js";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/** Web push only — not Capacitor WebView (no service worker / FCM browser APIs). */
function canUseWebFcm() {
  if (typeof window === "undefined") return false;
  if (isNativeCapacitorShell()) return false;
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return false;
  return true;
}

/** @type {Promise<import("firebase/messaging").Messaging | null> | null} */
let messagingInit = null;

function initFcm() {
  if (!canUseWebFcm()) return Promise.resolve(null);
  if (messagingInit) return messagingInit;

  messagingInit = (async () => {
    try {
      if (!(await isSupported())) return null;
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      return getMessaging(app);
    } catch {
      return null;
    }
  })();

  return messagingInit;
}

export async function requestFcmToken() {
  const messaging = await initFcm();
  if (!messaging || !VAPID) return null;
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return null;
    const token = await getToken(messaging, { vapidKey: VAPID });
    return token || null;
  } catch {
    return null;
  }
}

/** @param {(payload: Record<string, unknown>) => void} [onReceived] */
export function listenForForegroundMessages(onReceived) {
  if (!canUseWebFcm()) return () => {};

  let unsub = () => {};
  let active = true;

  initFcm()
    .then((messaging) => {
      if (!active || !messaging) return;
      try {
        unsub = onMessage(messaging, (payload) => {
          const data = payload?.notification || payload?.data;
          onReceived?.(data && typeof data === "object" ? { ...data } : {});
        });
      } catch {
        /* unsupported browser context */
      }
    })
    .catch(() => {});

  return () => {
    active = false;
    unsub();
  };
}
