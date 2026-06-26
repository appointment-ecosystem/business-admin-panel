import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// VitePWA injects self.__WB_MANIFEST at build time
declare const __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;

// Cast to SW scope — runtime context is ServiceWorkerGlobalScope
const swScope = self as unknown as { registration: ServiceWorkerRegistration };

precacheAndRoute(__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigate fallback: serve /index.html for all navigation requests except /api/*
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api/],
  }),
);

// Static assets: cache-first with 7-day expiry
registerRoute(
  ({ request }: { request: Request }) =>
    /\.(js|css|png|svg|woff2|ico)$/i.test(request.url),
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  }),
);

// Firebase background messaging
const firebaseApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title ?? 'Yeni Randevu Bildirimi';
  const body = payload.notification?.body ?? '';
  void swScope.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
  });
});
