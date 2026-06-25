// Bu dosya, kullanıcı giriş (login) sayfasını ve form doğrulamasını içerir.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getMe, login } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { ApiError, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Zod Doğrulama Şeması
// Girilen değer @ içeriyorsa email, içermiyorsa Türk telefon numarası olarak doğrulanır
const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'E-posta veya telefon numarası zorunludur')
    .superRefine((val, ctx) => {
      if (val.includes('@')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Lütfen geçerli bir e-posta adresi girin',
          });
        }
      } else {
        const digitsOnly = val.replace(/[\s\-()]/g, '');
        if (!/^\d{10,}$/.test(digitsOnly)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Lütfen geçerli bir telefon numarası girin (örn: 05551234567)',
          });
        }
      }
    }),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function getDashboardPath(role: UserRole): string {
  if (role === 'ADMIN') {
    return '/admin/dashboard';
  }
  if (role === 'BUSINESS_OWNER' || role === 'BUSINESS_EMPLOYEE') {
    return '/business/dashboard';
  }
  return '/login';
}

// Backend hata mesajlarını Türkçeye çeviren yardımcı fonksiyon
function translateErrorMessage(message: string): string {
  const translations: Record<string, string> = {
    'invalid credentials': 'E-posta/telefon veya şifre hatalı.',
    'user not found': 'Bu bilgilere sahip bir kullanıcı bulunamadı.',
    'account is disabled': 'Hesabınız devre dışı bırakılmıştır.',
    'account is locked': 'Hesabınız kilitlenmiştir. Lütfen destek ile iletişime geçin.',
    'too many login attempts': 'Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.',
    'bad credentials': 'E-posta/telefon veya şifre hatalı.',
    'email not verified': 'E-posta adresiniz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin.',
    'phone not verified': 'Telefon numaranız doğrulanmamış.',
    'internal server error': 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    'service unavailable': 'Hizmet şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.',
    'access denied': 'Bu panele erişim yetkiniz bulunmamaktadır.',
    'unauthorized': 'Yetkisiz erişim. Lütfen tekrar giriş yapın.',
  };

  const lowerMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(translations)) {
    if (lowerMessage.includes(key)) {
      return value;
    }
  }

  return message || 'Giriş başarısız. Lütfen tekrar deneyin.';
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.message) {
      return translateErrorMessage(data.message);
    }
  }
  return 'Giriş başarısız. Lütfen tekrar deneyin.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const identifier = values.identifier.trim();
      const isEmail = identifier.includes('@');

      // API payload: @ içeriyorsa email, içermiyorsa phone
      const loginRes = await login(
        isEmail ? identifier : '',
        isEmail ? '' : identifier.replace(/[\s\-()]/g, ''),
        values.password,
      );
      const { accessToken, refreshToken } = loginRes.data;

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);

      const meRes = await getMe();
      const user = meRes.data;

      setAuth(user, accessToken, refreshToken);
      navigate(getDashboardPath(user.role), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Giriş Yap</CardTitle>
          <CardDescription>
            İşletme veya yönetici paneline erişmek için hesabınızla giriş
            yapın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">E-posta veya Telefon</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="ornek@email.com veya 05xxxxxxxxx"
                autoComplete="username"
                aria-invalid={Boolean(errors.identifier)}
                {...register('identifier')}
              />
              {errors.identifier && (
                <p className="text-sm text-destructive">{errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
