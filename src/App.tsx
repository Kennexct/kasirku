import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/Layout/AppShell';
import { OwnerGate } from './components/Layout/OwnerGate';
import { LockScreen } from './components/Pin/LockScreen';
import { OwnerPinHost } from './components/Pin/OwnerPinHost';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ROUTES } from './constants';
import { useBootstrap } from './hooks/useBootstrap';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { CashPage } from './pages/Cash/CashPage';
import { CustomersPage } from './pages/Customers/CustomersPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { MorePage } from './pages/More/MorePage';
import { OpenOrdersPage } from './pages/OpenOrders/OpenOrdersPage';
import { POSPage } from './pages/POS/POSPage';
import { ProductsPage } from './pages/Products/ProductsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { useSessionStore } from './store/useSessionStore';

// ADR-001: charts + export code load only when Reports is opened.
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage'));

export default function App() {
  useOnlineStatus();
  const boot = useBootstrap();
  const hasSeller = useSessionStore((s) => s.cashier !== null);

  if (boot.status === 'loading') return <LoadingScreen message="Menyiapkan kasir…" />;
  if (boot.status === 'error') {
    return (
      <div role="alert" className="p-6 text-center text-danger-700">
        {boot.message}
      </div>
    );
  }

  const toaster = (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
        className: '!rounded-lg !border !border-line !bg-surface !px-4 !py-3 !text-[14px] !font-medium !text-ink !shadow-pop',
        success: { iconTheme: { primary: '#0b7a5a', secondary: '#ffffff' } },
        error: { iconTheme: { primary: '#c2281d', secondary: '#ffffff' } },
      }}
    />
  );

  // ADR-004: a PIN exists and nobody is signed in on this device → choose the seller first.
  if (!hasSeller) {
    return (
      <>
        <LockScreen />
        {toaster}
      </>
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
              <OwnerGate>
                <Suspense fallback={<LoadingScreen message="Memuat laporan…" />}>
                  <ReportsPage />
                </Suspense>
              </OwnerGate>
            }
          />
          <Route path={ROUTES.products} element={<OwnerGate><ProductsPage /></OwnerGate>} />
          <Route path={ROUTES.settings} element={<OwnerGate><SettingsPage /></OwnerGate>} />
          <Route path={ROUTES.customers} element={<CustomersPage />} />
          <Route path={ROUTES.cash} element={<CashPage />} />
          <Route path={ROUTES.more} element={<MorePage />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.pos} replace />} />
      </Routes>
      <OwnerPinHost />
      {toaster}
    </BrowserRouter>
  );
}
