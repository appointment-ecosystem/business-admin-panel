// Bu dosya, uygulama rotalarını React Router v6 ile tanımlar.
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import ProtectedRoute from '@/router/ProtectedRoute';
import BusinessLayout from '@/components/layout/BusinessLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import BusinessDashboardPage from '@/pages/business/BusinessDashboardPage';
import BusinessProfilePage from '@/pages/business/BusinessProfilePage';
import BusinessServicesPage from '@/pages/business/BusinessServicesPage';
import BusinessServiceNewPage from '@/pages/business/BusinessServiceNewPage';
import BusinessServiceDetailPage from '@/pages/business/BusinessServiceDetailPage';
import BusinessStaffPage from '@/pages/business/BusinessStaffPage';
import BusinessStaffNewPage from '@/pages/business/BusinessStaffNewPage';
import BusinessStaffDetailPage from '@/pages/business/BusinessStaffDetailPage';
import BusinessWorkingHoursPage from '@/pages/business/BusinessWorkingHoursPage';
import BusinessAppointmentsPage from '@/pages/business/BusinessAppointmentsPage';
import BusinessReviewsPage from '@/pages/business/BusinessReviewsPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminBusinessesPage from '@/pages/admin/AdminBusinessesPage';
import AdminBusinessDetailPage from '@/pages/admin/AdminBusinessDetailPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminUserDetailPage from '@/pages/admin/AdminUserDetailPage';
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage';
import AdminReviewsPage from '@/pages/admin/AdminReviewsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/business',
    element: <ProtectedRoute requiredRole="business" />,
    children: [
      {
        element: <BusinessLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <BusinessDashboardPage />,
          },
          {
            path: 'profile',
            element: <BusinessProfilePage />,
          },
          {
            path: 'services',
            element: <BusinessServicesPage />,
          },
          {
            path: 'services/new',
            element: <BusinessServiceNewPage />,
          },
          {
            path: 'services/:id',
            element: <BusinessServiceDetailPage />,
          },
          {
            path: 'staff',
            element: <BusinessStaffPage />,
          },
          {
            path: 'staff/new',
            element: <BusinessStaffNewPage />,
          },
          {
            path: 'staff/:id',
            element: <BusinessStaffDetailPage />,
          },
          {
            path: 'working-hours',
            element: <BusinessWorkingHoursPage />,
          },
          {
            path: 'appointments',
            element: <BusinessAppointmentsPage />,
          },
          {
            path: 'reviews',
            element: <BusinessReviewsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute requiredRole="admin" />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'businesses',
            element: <AdminBusinessesPage />,
          },
          {
            path: 'businesses/:id',
            element: <AdminBusinessDetailPage />,
          },
          {
            path: 'users',
            element: <AdminUsersPage />,
          },
          {
            path: 'users/:id',
            element: <AdminUserDetailPage />,
          },
          {
            path: 'categories',
            element: <AdminCategoriesPage />,
          },
          {
            path: 'reviews',
            element: <AdminReviewsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);
