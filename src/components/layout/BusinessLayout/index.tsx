// Bu dosya, işletme paneli için sabit sidebar ve scroll edilebilir içerik alanından oluşan ana layout bileşenidir.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Clock,
  LayoutDashboard,
  LogOut,
  Scissors,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { logout } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: '/business/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/business/profile', label: 'Profilim', icon: Building2 },
  { to: '/business/services', label: 'Hizmetler', icon: Scissors },
  { to: '/business/staff', label: 'Personel', icon: Users },
  { to: '/business/working-hours', label: 'Çalışma Saatleri', icon: Clock },
  { to: '/business/appointments', label: 'Randevular', icon: CalendarDays },
  { to: '/business/reviews', label: 'Yorumlar', icon: Star },
];

function SidebarNavLink({ to, label, icon: Icon }: NavItem) {
  return (
    <NavLink
      to={to}
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

export default function BusinessLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

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

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r bg-card">
        <div className="border-b px-4 py-5">
          <h1 className="text-lg font-semibold tracking-tight">İşletme Paneli</h1>
          {user?.fullName && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {user.fullName}
            </p>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
          {navItems.map((item) => (
            <SidebarNavLink key={item.to} {...item} />
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
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  );
}
