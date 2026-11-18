import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import { PagePlaceholder } from './components/PagePlaceholder';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ROUTES } from './constants';
import { useBootstrap } from './hooks/useBootstrap';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { HistoryPage } from './pages/History/HistoryPage';
import { MorePage } from './pages/More/MorePage';
import { OpenOrdersPage } from './pages/OpenOrders/OpenOrdersPage';
import { POSPage } from './pages/POS/POSPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

// ADR-001: charts + export code load only when Reports is opened.
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));

const PLACEHOLDER_ROUTES = [
  { path: ROUTES.customers, title: 'Pelanggan', prdRef: 'M7', description: 'Data pelanggan.' },
] as const;

export default function App() {
  useOnlineStatus();
  const boot = useBootstrap();

  if (boot.status === 'loading') return <LoadingScreen message="Menyiapkan kasir…" />;
  if (boot.status === 'error') {
    return (
      <div role="alert" className="p-6 text-center text-danger-700">
        {boot.message}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path={ROUTES.pos} element={<POSPage />} />
          <Route path={ROUTES.openOrders} element={<OpenOrdersPage />} />
          <Route path={ROUTES.history} element={<HistoryPage />} />
          <Route
            path={ROUTES.reports}
            element={
              <Suspense fallback={<LoadingScreen message="Memuat laporan…" />}>
                <ReportsPage />
              </Suspense>
            }
          />
          <Route path={ROUTES.products} element={<ProductsPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path={ROUTES.more} element={<MorePage />} />
          {PLACEHOLDER_ROUTES.map(({ path, ...props }) => (
            <Route key={path} path={path} element={<PagePlaceholder {...props} />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.pos} replace />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          className: '!rounded-lg !border !border-line !bg-surface !px-4 !py-3 !text-[14px] !font-medium !text-ink !shadow-pop',
          success: { iconTheme: { primary: '#0b7a5a', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#c2281d', secondary: '#ffffff' } },
        }}
      />
    </BrowserRouter>
  );
}
