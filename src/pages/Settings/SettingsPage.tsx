import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/Layout/PageHeader';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Tabs } from '../../components/ui/Tabs';
import { useAppData } from '../../hooks/useAppData';
import { BackupSettings } from './BackupSettings';
import { PaymentMethodSettings } from './PaymentMethodSettings';
import { SalesModeSettings } from './SalesModeSettings';
import { StaffSettings } from './StaffSettings';
import { StoreSettings } from './StoreSettings';

const TABS = [
  { value: 'store', label: 'Toko & Struk' },
  { value: 'payments', label: 'Pembayaran' },
  { value: 'modes', label: 'Mode Penjualan' },
  { value: 'staff', label: 'Staf & PIN' },
  { value: 'backup', label: 'Cadangan' },
] as const;
type TabId = (typeof TABS)[number]['value'];

export function SettingsPage() {
  const { store, catalog } = useAppData();
  const [params] = useSearchParams();
  const requested = TABS.find((t) => t.value === params.get('tab'))?.value;
  const [tab, setTab] = useState<TabId>(requested ?? 'store');

  if (!store || !catalog) return <LoadingScreen />;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader title="Pengaturan" description="Profil toko, struk, pembayaran, mode penjualan, staf dan PIN.">
        <Tabs label="Bagian pengaturan" items={TABS} value={tab} onChange={setTab} />
      </PageHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-8 md:py-6">
        <div className="max-w-2xl">
          {tab === 'store' && <StoreSettings store={store} />}
          {tab === 'payments' && <PaymentMethodSettings storeId={store.id} methods={catalog.paymentMethods} />}
          {tab === 'modes' && <SalesModeSettings storeId={store.id} modes={catalog.salesModes} />}
          {tab === 'staff' && <StaffSettings store={store} />}
          {tab === 'backup' && <BackupSettings />}
        </div>
      </div>
    </section>
  );
}
