import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { badgeBrand, card } from '../../components/ui/styles';
import { ROUTES } from '../../constants';
import { formatRupiah } from '../../lib/money';
import { profitLines, type Profit } from '../../lib/profit';

const signed = (amount: number) => (amount < 0 ? `− ${formatRupiah(-amount)}` : formatRupiah(amount));
const marginText = (pct: number) => `${pct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
const linkClass = 'font-semibold text-brand-700 underline-offset-2 hover:underline';

/** Profit statement for the period (ADR-007). Chooses cost mode or simple mode from the data; a hint when there is neither. */
export function ProfitCard({ profit }: { profit: Profit }) {
  if (profit.mode === 'none') {
    return (
      <section aria-label="Laba" className={`${card} px-4 py-3.5 text-[14px] text-ink-soft`}>
        <span className="font-semibold text-ink">Ingin tahu untungnya? </span>
        Isi harga modal di <Link to={ROUTES.products} className={linkClass}>Produk</Link>, atau catat pengeluaran di{' '}
        <Link to={ROUTES.cash} className={linkClass}>Kas</Link>.
      </section>
    );
  }

  const isCost = profit.mode === 'cost';
  return (
    <section aria-label="Laba" className={`${card} grid gap-x-8 gap-y-4 p-4 md:grid-cols-[minmax(0,400px)_1fr] md:p-5`}>
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[15px] font-semibold">{isCost ? 'Laba' : 'Penjualan dan pengeluaran'}</h2>
          {isCost && profit.marginPct !== null && <span className={badgeBrand}>Margin kotor {marginText(profit.marginPct)}</span>}
        </div>
        <dl className="flex flex-col gap-2">
          {profitLines(profit).map((line) => (
            <div key={line.label} className={`flex items-baseline justify-between gap-3 ${line.kind === 'plain' ? '' : 'border-t border-line pt-2'}`}>
              <dt className={line.kind === 'plain' ? 'text-[14px] text-ink-soft' : 'text-[14px] font-semibold text-ink'}>{line.label}</dt>
              <dd className={`num ${line.kind === 'total' ? 'text-[22px] font-extrabold tracking-[-0.02em]' : line.kind === 'subtotal' ? 'text-[15px] font-bold' : 'text-[15px] font-semibold'} ${line.kind !== 'plain' && line.amount < 0 ? 'text-danger-700' : ''}`}>
                {signed(line.amount)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col gap-2.5 text-[13px] text-muted md:border-l md:border-line md:pl-8">
        {isCost ? (
          <>
            <p>Harga modal dihitung dari modal setiap menu saat terjual. Refund tidak mengurangi modal karena makanannya sudah dibuat.</p>
            {profit.ingredientExpenses > 0 && (
              <p>
                Belanja bahan <span className="num font-semibold text-ink-soft">{formatRupiah(profit.ingredientExpenses)}</span> tidak dikurangkan lagi, karena sudah terhitung lewat harga modal.
              </p>
            )}
            {profit.uncostedQty > 0 && (
              <p className="flex gap-2 rounded-lg border border-warn-200 bg-warn-50 px-3 py-2.5 text-warn-700">
                <TriangleAlert aria-hidden size={16} className="mt-0.5 shrink-0" />
                <span>
                  {profit.uncostedQty} item terjual belum punya harga modal ({profit.uncostedProducts.join(', ')}), jadi laba terlihat lebih besar dari sebenarnya.{' '}
                  <Link to={ROUTES.products} className="font-semibold underline underline-offset-2">Isi harga modal</Link>
                </span>
              </p>
            )}
          </>
        ) : (
          <>
            <p>Angka ini penjualan dikurangi semua pengeluaran yang dicatat pada periode ini, termasuk belanja bahan.</p>
            <p>
              Untuk laba per menu yang terjual, isi harga modal di <Link to={ROUTES.products} className={linkClass}>Produk</Link>.
            </p>
          </>
        )}
        {profit.taxTotal > 0 && <p>Pajak yang dipungut ({formatRupiah(profit.taxTotal)}) tidak dihitung sebagai penjualan.</p>}
      </div>
    </section>
  );
}
