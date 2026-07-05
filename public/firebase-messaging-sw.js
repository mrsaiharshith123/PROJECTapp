/* eslint-disable no-undef */
/** Firebase Cloud Messaging service worker — background push on web/PWA. */
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDmBZAbGP3bYPN1TfwVUPsI0gbLhyfJ0rw",
  authDomain: "perovo-b472f.firebaseapp.com",
  projectId: "perovo-b472f",
  storageBucket: "perovo-b472f.firebasestorage.app",
  messagingSenderId: "747941494639",
  appId: "1:747941494639:web:ba7119ad26203e1569329a",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Perovo";
  const body = payload.notification?.body || "";
  const route = payload.data?.route;
  self.registration.showNotification(title, {
    body,
    icon: "/pwa-192.png",
    data: { route },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event.notification?.data?.route;
  if (route) {
    event.waitUntil(clients.openWindow(route));
  }
});
