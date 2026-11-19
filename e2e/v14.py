"""v0.14 flow against `wrangler pages dev` (DEV_MODE=1): landing → sign-up with an emailed code → trial → POS sale →
Midtrans payment (dev Snap + a signed notification) → paid; then an expired device is read-only; sign out.
Usage: python3 e2e/v14.py http://localhost:8788 OUT /tmp/wrangler.log dev-server-key"""
import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

BASE, OUT, LOG, SERVER_KEY = sys.argv[1:5]
errors = []


def shot(page, name):
    page.wait_for_timeout(400)
    page.screenshot(path=f'{OUT}/{name}.png')


def latest_code(email):
    for _ in range(40):
        codes = re.findall(rf'login code for {re.escape(email)}: (\d{{6}})', open(LOG).read())
        if codes:
            return codes[-1]
        time.sleep(0.25)
    raise AssertionError('no code in log')


def notify(order_id, amount, status='settlement'):
    gross = f'{amount}.00'
    body = {'order_id': order_id, 'status_code': '200', 'gross_amount': gross, 'transaction_status': status, 'payment_type': 'qris',
            'signature_key': hashlib.sha512((order_id + '200' + gross + SERVER_KEY).encode()).hexdigest()}
    req = urllib.request.Request(f'{BASE}/api/billing/midtrans', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    return urllib.request.urlopen(req).status


def sell(page, is_mobile):
    page.get_by_role('button', name='Kerupuk').first.click()
    if is_mobile:
        page.get_by_role('button', name='Lihat pesanan').click()
    page.get_by_role('button', name='Bayar').click()
    page.get_by_role('button', name='Uang pas').click()
    page.get_by_role('button', name='Selesaikan pembayaran').click()


def run(p, name, viewport, is_mobile):
    email = f'{name}-{int(time.time())}@warung.id'
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    page = browser.new_context(locale='id-ID', viewport=viewport, is_mobile=is_mobile, has_touch=is_mobile).new_page()
    page.on('pageerror', lambda e: errors.append(f'{name}: {e}'))
    page.on('response', lambda r: r.status >= 500 and errors.append(f'{name}: {r.status} {r.url}'))

    # 1. Landing → app → sign-in
    page.goto(BASE + '/')
    page.get_by_role('heading', name='Kasir yang tetap jalan, walau sinyal hilang.').wait_for()
    assert page.get_by_text('Rp49.000').count() > 0
    page.get_by_role('link', name='Coba gratis 14 hari').first.click()
    page.get_by_role('heading', name='Masuk atau daftar').wait_for()
    assert page.url.endswith('/app/'), page.url
    shot(page, f'{name}-a1-signin')
    page.locator('#signin-email').fill('bukan-email')
    assert page.get_by_role('button', name='Kirim kode masuk').is_disabled()
    page.locator('#signin-email').fill(email)
    page.get_by_role('button', name='Kirim kode masuk').click()
    page.get_by_role('heading', name='Cek email Anda').wait_for()
    code = latest_code(email)
    page.locator('#signin-code').fill('000000' if code != '000000' else '111111')
    page.get_by_role('button', name='Masuk', exact=True).click()
    page.get_by_role('alert').filter(has_text='Kode salah').wait_for()
    page.locator('#signin-code').fill(code)
    shot(page, f'{name}-a2-code')
    page.get_by_role('button', name='Masuk', exact=True).click()

    # 2. First-time journey, then a sale during the trial
    page.get_by_role('button', name='Lewati, pakai contoh toko').click()
    page.get_by_role('button', name='Kerupuk').first.wait_for()
    sell(page, is_mobile)
    page.get_by_text('Pembayaran berhasil').wait_for()
    page.get_by_role('button', name='Transaksi baru').click()

    # 3. Settings → Langganan: trial, pay monthly
    page.goto(BASE + '/app/pengaturan?tab=subscription')
    page.get_by_text(re.compile(r'Coba gratis, sisa 14 hari')).wait_for()
    shot(page, f'{name}-a3-trial')
    page.get_by_role('button', name=re.compile('^Bulanan')).click()
    page.wait_for_url(re.compile(r'/app/pengaturan\?tab=subscription(&|$)'))
    page.get_by_text('Menunggu').wait_for()
    order_id = page.locator('li p.truncate').first.inner_text().split('·')[-1].strip()
    # wrong amount is refused
    try:
        notify(order_id, 1)
        raise AssertionError('wrong amount accepted')
    except urllib.error.HTTPError as e:
        assert e.code == 400
    assert notify(order_id, 49000) == 200
    page.reload()
    page.get_by_text(re.compile(r'^Aktif sampai')).wait_for()
    page.get_by_text('Lunas').wait_for()
    shot(page, f'{name}-a4-paid')

    # 4. A device whose clock has passed the end (and the grace) is read-only; reports still open
    page.evaluate("localStorage.setItem('kk.lastSeen', String(Date.now() + 400 * 86400000))")
    page.goto(BASE + '/app/')
    page.get_by_role('alert').filter(has_text='Langganan sudah berakhir').wait_for()
    page.get_by_role('button', name='Kerupuk').first.wait_for()
    sell(page, is_mobile)
    page.get_by_text(re.compile('Perpanjang di Pengaturan')).wait_for()
    shot(page, f'{name}-a5-expired')
    page.goto(BASE + '/app/laporan')
    page.get_by_role('heading', name='Laporan').first.wait_for()

    # 5. Sign out → sign-in screen; local data stays
    page.goto(BASE + '/app/pengaturan?tab=subscription')
    page.get_by_role('button', name='Keluar dari akun').click()
    page.get_by_role('heading', name='Masuk atau daftar').wait_for()
    stores = page.evaluate("async () => { const db = await new Promise((r) => { const q = indexedDB.open('kasirku'); q.onsuccess = () => r(q.result); }); return new Promise((r) => { const q = db.transaction('stores').objectStore('stores').count(); q.onsuccess = () => r(q.result); }); }")
    assert stores == 1, stores
    browser.close()
    print(f'{name}: ok ({order_id})')


with sync_playwright() as p:
    run(p, 'tablet', {'width': 1024, 'height': 768}, False)
    run(p, 'phone', {'width': 390, 'height': 844}, True)
print('errors:', errors)
sys.exit(1 if errors else 0)
