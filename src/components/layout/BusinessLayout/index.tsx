// Bu dosya, işletme paneli için responsive layout bileşenidir.
// Masaüstünde: sabit 240px sidebar + scroll edilebilir içerik alanı
// Mobilde: üst header (hamburger) + drawer overlay menü + alt bottom nav bar
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Star,
  Users,
  Users2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { getToken, onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { logout } from '@/api/auth';
import api from '@/api/axios';
import { messaging } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useFcmToken } from '@/hooks/useFcmToken';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const FCM_TOKEN_KEY = 'fcm_token';

function NotificationBanner() {
  const user = useAuthStore((state) => state.user);
  const [permission, setPermission] = useState<NotificationPermission | null>(
    () => ('Notification' in window ? Notification.permission : null),
  );
  const [dismissed, setDismissed] = useState(false);

  const isBusiness =
    user?.role === 'BUSINESS_OWNER' || user?.role === 'BUSINESS_EMPLOYEE';

  // Uygulama açıkken gelen bildirimleri sonner toast ile göster
  useEffect(() => {
    if (permission !== 'granted' || !isBusiness) return;
    return onMessage(messaging, (payload) => {
      toast(payload.notification?.title ?? 'Yeni Bildirim', {
        description: payload.notification?.body,
      });
    });
  }, [permission, isBusiness]);

  const handleRequest = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result !== 'granted') return;
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
      // Token alınamazsa sessizce geç
    }
  };

  if (!isBusiness || permission !== 'default' || dismissed) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-blue-50 px-4 py-2 text-sm text-blue-800">
      <Bell className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">Randevu bildirimlerini almak için izin verin.</span>
      <button
        type="button"
        onClick={() => void handleRequest()}
        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Randevu bildirimlerini aç
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded-lg p-1 text-blue-600 hover:text-blue-800"
        aria-label="Kapat"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean; // true ise BUSINESS_EMPLOYEE göremez
}

const navItems: NavItem[] = [
  { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business/appointments', label: 'Randevular', icon: CalendarDays },
  { to: '/business/customers', label: 'Müşteriler', icon: Users2 },
  { to: '/business/services', label: 'Hizmetler', icon: Scissors },
  { to: '/business/profile', label: 'Profilim', icon: Building2 },
  { to: '/business/staff', label: 'Personel', icon: Users, ownerOnly: true },
  {
    to: '/business/working-hours',
    label: 'Çalışma Saatleri',
    icon: Clock,
    ownerOnly: true,
  },
  { to: '/business/reviews', label: 'Yorumlar', icon: Star },
];

// Mobil bottom nav'da gösterilecek 5 ana item (sabit sıra)
const bottomNavItems: NavItem[] = [
  { to: '/business/dashboard', label: 'Ana Sayfa', icon: LayoutDashboard },
  { to: '/business/appointments', label: 'Randevular', icon: CalendarDays },
  { to: '/business/customers', label: 'Müşteriler', icon: Users2 },
  { to: '/business/services', label: 'Hizmetler', icon: Scissors },
  { to: '/business/profile', label: 'Profil', icon: Building2 },
];

function SidebarNavLink({ to, label, icon: Icon, onClick }: NavItem & { onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </NavLink>
  );
}

function BottomNavLink({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-medium transition-colors',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground',
        )
      }
    >
      <Icon className="size-5 shrink-0" aria-hidden />
      <span className="truncate max-w-[56px] text-center">{label}</span>
    </NavLink>
  );
}

export default function BusinessLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [drawerOpen, setDrawerOpen] = useState(false);
  useFcmToken();

  const isEmployee = user?.role === 'BUSINESS_EMPLOYEE';

  // Role'e göre filtrelenmiş nav items
  const visibleNavItems = navItems.filter(
    (item) => !(item.ownerOnly && isEmployee),
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // API hatası olsa bile oturumu kapat ve yönlendir
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="border-b px-4 py-5">
        <h1 className="text-lg font-semibold tracking-tight">İşletme Paneli</h1>
        {user?.fullName && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {user.fullName}
          </p>
        )}
        {isEmployee && (
          <span className="mt-1 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
            Personel
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {visibleNavItems.map((item) => (
          <SidebarNavLink
            key={item.to}
            {...item}
            onClick={onNavClick}
          />
        ))}
      </nav>

      <div className="border-t p-4">
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-4 shrink-0" aria-hidden />
          Çıkış
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ===== MASAÜSTÜ SIDEBAR (md ve üzeri) ===== */}
      <aside className="hidden md:flex h-screen w-[240px] shrink-0 flex-col border-r bg-card">
        <SidebarContent />
      </aside>

      {/* ===== MOBİL: DRAWER OVERLAY ===== */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-[280px] flex-col bg-card shadow-xl md:hidden">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-semibold">Menü</span>
              <button
                type="button"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                onClick={() => setDrawerOpen(false)}
                aria-label="Menüyü kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <SidebarContent onNavClick={() => setDrawerOpen(false)} />
            </div>
          </aside>
        </>
      )}

      {/* ===== ANA İÇERİK ALANI ===== */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* MOBİL ÜSRT HEADER */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 md:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
            onClick={() => setDrawerOpen(true)}
            aria-label="Menüyü aç"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-semibold text-sm">İşletme Paneli</span>
        </header>

        {/* BİLDİRİM İZİN BANNER'I */}
        <NotificationBanner />

        {/* SAYFA İÇERİĞİ */}
        {/* pb-20 = bottom nav için boşluk bırak (mobil) */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-background p-4 pb-24 md:p-6 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ===== MOBİL BOTTOM NAV ===== */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-stretch border-t bg-card md:hidden"
        aria-label="Alt gezinme"
      >
        {bottomNavItems.map((item) => (
          <BottomNavLink key={item.to} {...item} />
        ))}
      </nav>
    </div>
  );
}
