import { createBrowserRouter } from 'react-router';
import { AdminProvider } from './context/AdminContext';
import { ThemeProvider } from '@/app/context/ThemeContext';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminBusinessDetailsPage } from './pages/AdminBusinessDetailsPage';
import { AdminCustomersPage } from './pages/AdminCustomersPage';

// ── Root wrapper that supplies global providers ───────────────────────────────
function Root() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <AdminDashboard />
      </AdminProvider>
    </ThemeProvider>
  );
}

function LoginRoot() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <AdminLoginPage />
      </AdminProvider>
    </ThemeProvider>
  );
}

function BusinessDetailsRoot() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <AdminBusinessDetailsPage />
      </AdminProvider>
    </ThemeProvider>
  );
}

function CustomersRoot() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <AdminCustomersPage />
      </AdminProvider>
    </ThemeProvider>
  );
}

export const adminRouter = createBrowserRouter(
  [
    {
      path: '/admin/login',
      element: <LoginRoot />,
    },
    {
      path: '/admin/',
      element: <Root />,
    },
    {
      path: '/admin/customers',
      element: <CustomersRoot />,
    },
    {
      path: '/admin/businesses/:businessId',
      element: <BusinessDetailsRoot />,
    },
    {
      path: '/admin/*',
      element: <Root />,
    },
  ],
  { basename: import.meta.env.PROD ? '/' : '/admin.html' }
);
