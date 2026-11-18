import { useState } from 'react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Tabs } from '../../components/ui/Tabs';
import { useAppData } from '../../hooks/useAppData';
import { PaymentMethodSettings } from './PaymentMethodSettings';
import { SalesModeSettings } from './SalesModeSettings';
import { StoreSettings } from './StoreSettings';

const TABS = [
  { value: 'store', label: 'Toko & Struk' },
  { value: 'payments', label: 'Pembayaran' },
  { value: 'modes', label: 'Mode Penjualan' },
] as const;
type TabId = (typeof TABS)[number]['value'];

export function SettingsPage() {
  const { store, catalog } = useAppData();
  const [tab, setTab] = useState<TabId>('store');

  if (!store || !catalog) return <LoadingScreen />;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Pengaturan" description="Profil toko, struk, pembayaran, dan mode penjualan.">
        <Tabs label="Bagian pengaturan" items={TABS} value={tab} onChange={setTab} />
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-8 md:py-6">
        <div className="max-w-2xl">
          {tab === 'store' && <StoreSettings store={store} />}
          {tab === 'payments' && <PaymentMethodSettings methods={catalog.paymentMethods} />}
          {tab === 'modes' && <SalesModeSettings modes={catalog.salesModes} />}
        </div>
      </div>
    </section>
  );
}
