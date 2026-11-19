import { PHOTO_MAX_DIMENSION_PX, PHOTO_MAX_INPUT_BYTES, PHOTO_MAX_OUTPUT_BYTES } from '../constants';
import type { Result } from '../types';
import { t } from '../i18n';

interface CompressOptions {
  maxDimension: number;
  maxBytes: number;
  qualities: readonly number[];
}

const PRODUCT_PHOTO: CompressOptions = {
  maxDimension: PHOTO_MAX_DIMENSION_PX,
  maxBytes: PHOTO_MAX_OUTPUT_BYTES,
  qualities: [0.85, 0.7, 0.55, 0.4],
};

/** QR codes must stay sharp to scan: bigger size, high quality only. */
const QRIS_IMAGE: CompressOptions = {
  maxDimension: 1200,
  maxBytes: 1024 * 1024,
  qualities: [0.95, 0.9],
};

const BASE64_OVERHEAD = 0.75;

function approxBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.ceil(base64.length * BASE64_OVERHEAD);
}

async function compress(file: File, options: CompressOptions): Promise<Result<string>> {
  if (!file.type.startsWith('image/')) return { ok: false, error: t('File harus berupa gambar.') };
  if (file.size > PHOTO_MAX_INPUT_BYTES) return { ok: false, error: t('Ukuran foto maksimal 10 MB.') };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { ok: false, error: t('Format foto tidak didukung. Coba JPG atau PNG.') };
  }

  const scale = Math.min(1, options.maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return { ok: false, error: t('Browser tidak mendukung pengolahan foto.') };
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of options.qualities) {
    const dataUrl = canvas.toDataURL('image/webp', quality);
    if (approxBytes(dataUrl) <= options.maxBytes) return { ok: true, value: dataUrl };
  }
  return { ok: false, error: t('Foto terlalu besar setelah dikompres. Coba foto lain.') };
}

/**
 * Returns a compressed WebP data URL stored on the device (works offline).
 * TODO(M3): upload to Supabase Storage on sync and replace with the public URL.
 */
export const compressProductPhoto = (file: File) => compress(file, PRODUCT_PHOTO);
export const compressQrisImage = (file: File) => compress(file, QRIS_IMAGE);
