import { useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import api from '@/api/axios';

const FCM_TOKEN_KEY = 'fcm_token';

export function useFcmToken(): void {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const isBusiness =
      user?.role === 'BUSINESS_OWNER' || user?.role === 'BUSINESS_EMPLOYEE';
    if (!isAuthenticated || !isBusiness) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        const stored = localStorage.getItem(FCM_TOKEN_KEY);
        if (token !== stored) {
          await api.post('/device-tokens/register', { token, platform: 'WEB' });
          localStorage.setItem(FCM_TOKEN_KEY, token);
        }
      } catch {
        // Token yenileme başarısız, sessizce geç
      }
    })();
  }, [user, isAuthenticated]);
}
