// Bu dosya, yetkilendirilmiş rotaları korur; token ve rol kontrolü yapar, getMe ile kullanıcıyı yükler.
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

type ProtectedRole = 'business' | 'admin';

interface ProtectedRouteProps {
  requiredRole: ProtectedRole;
}

function isBusinessRole(role: UserRole): boolean {
  return role === 'BUSINESS_OWNER' || role === 'BUSINESS_EMPLOYEE';
}

function hasRequiredRole(role: UserRole, requiredRole: ProtectedRole): boolean {
  if (requiredRole === 'admin') {
    return role === 'ADMIN';
  }
  return isBusinessRole(role);
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setIsVerifying(false);
      setIsAuthorized(false);
      return;
    }

    let isMounted = true;

    const verifySession = async () => {
      try {
        const meRes = await getMe();
        const me = meRes.data;

        if (!isMounted) {
          return;
        }

        if (!hasRequiredRole(me.role, requiredRole)) {
          setIsAuthorized(false);
          return;
        }

        if (accessToken && refreshToken) {
          setAuth(me, accessToken, refreshToken);
        }

        setIsAuthorized(true);
      } catch {
        if (!isMounted) {
          return;
        }
        clearAuth();
        setIsAuthorized(false);
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [accessToken, refreshToken, requiredRole, setAuth, clearAuth]);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"
          role="status"
          aria-label="Yükleniyor"
        />
      </div>
    );
  }

  if (!isAuthorized || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

/**
 * OwnerOnlyRoute: Sadece BUSINESS_OWNER erişebilir.
 * BUSINESS_EMPLOYEE girerse /business/dashboard'a yönlendirilir.
 * Bu component BusinessLayout içindeki alt rotalarda kullanılır.
 */
export function OwnerOnlyRoute() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'BUSINESS_EMPLOYEE') {
    return <Navigate to="/business/dashboard" replace />;
  }

  return <Outlet />;
}
