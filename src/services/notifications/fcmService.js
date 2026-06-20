import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/** @type {import("firebase/messaging").Messaging | null} */
let messaging = null;

function initFcm() {
  if (!import.meta.env.VITE_FIREBASE_API_KEY) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    return getMessaging(app);
  } catch {
    return null;
  }
}

export async function requestFcmToken() {
  if (!messaging) messaging = initFcm();
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
  if (!messaging) messaging = initFcm();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    const data = payload?.notification || payload?.data;
    onReceived?.(data && typeof data === "object" ? { ...data } : {});
  });
}
