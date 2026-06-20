/* eslint-disable no-redeclare */
/* global importScripts, firebase, self */
// Replace REPLACE_WITH_* with Firebase console values before production deploy.
// Service workers cannot read import.meta.env.
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

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
  self.registration.showNotification(payload.notification?.title || "Perovo", {
    body: payload.notification?.body || "",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    data: payload.data,
  });
});
