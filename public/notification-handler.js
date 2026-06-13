/** Service worker: OS tray notifications + background reminder checks */

const DB_NAME = "committrack-notifications";
const DB_VERSION = 1;
const STORE = "snapshot";
const SENT_STORE = "sent";
const SYNC_TAG = "committrack-reminders";
const MAX_SHOW = 5;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(SENT_STORE)) db.createObjectStore(SENT_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(storeName, key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).get(key);
        req.onsuccess = () => {
          db.close();
          resolve(req.result);
        };
        req.onerror = () => {
          db.close();
          reject(req.error);
        };
      })
  );
}

function idbPut(storeName, key, value) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value, key);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

function sentKey(todayStr, id) {
  return `${todayStr || "day"}_${id}`;
}

async function wasSentToday(todayStr, id) {
  const row = await idbGet(SENT_STORE, sentKey(todayStr, id));
  return row === 1;
}

async function markSentToday(todayStr, id) {
  await idbPut(SENT_STORE, sentKey(todayStr, id), 1);
}

async function readSnapshot() {
  return idbGet(STORE, "current");
}

async function showTrayNotifications() {
  const snap = await readSnapshot();
  if (!snap || snap.remindersEnabled === false || !Array.isArray(snap.items)) return 0;

  const icon = snap.iconUrl || self.registration.scope + "pwa-192.png";
  const todayStr = snap.todayStr || "";
  let shown = 0;

  for (const item of snap.items.slice(0, MAX_SHOW)) {
    if (!item?.id || !item.body) continue;
    if (await wasSentToday(todayStr, item.id)) continue;

    try {
      await self.registration.showNotification(item.title || "Perovo", {
        body: item.body,
        tag: `ct-${item.id}`,
        icon,
        badge: icon,
        data: { id: item.id, type: "reminder" },
        vibrate: [180, 80, 180],
        renotify: true,
        requireInteraction: item.urgency === "critical",
        silent: false,
      });
      await markSentToday(todayStr, item.id);
      shown += 1;
    } catch {
      /* skip */
    }
  }
  return shown;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "FLUSH_REMINDERS") {
    event.waitUntil(showTrayNotifications());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(showTrayNotifications());
  }
});

self.addEventListener("periodicsync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(showTrayNotifications());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = self.registration.scope || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
