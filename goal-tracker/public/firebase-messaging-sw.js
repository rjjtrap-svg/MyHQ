// Firebase Cloud Messaging background handler for web push. Registered from
// src/lib/push.ts with the Firebase config passed as query params — this file is a static
// asset (Expo's web export copies `public/` verbatim, no env var substitution happens here),
// so it reads config from its own registration URL instead of hardcoding a project's keys.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const params = new URL(location.href).searchParams;

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Goal Tracker';
  const body = payload.notification?.body || '';
  self.registration.showNotification(title, { body, icon: '/favicon.ico' });
});
