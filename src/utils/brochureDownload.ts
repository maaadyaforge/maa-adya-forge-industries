import { ASSETS } from '../data/catalog';
import {
  getEmbeddedPdfBase64,
  isStandaloneMode,
  resolveAssetUrl,
} from './assetUrl';
import { isValidPdfBuffer } from './inquiry';

export type BrochureKind = 'main' | 'castables' | 'bricks';

const BROCHURE_CONFIG: Record<
  BrochureKind,
  { apiPath: string; fallbackPath: string; filename: string }
> = {
  main: {
    apiPath: '/api/brochure/main',
    fallbackPath: ASSETS.brochurePdf,
    filename: 'MAA-Adya-Forge-Brochure.pdf',
  },
  castables: {
    apiPath: '/api/brochure/castables',
    fallbackPath: ASSETS.castablesPdf,
    filename: 'Maa-Adya-Forge-Castables-Product-Data-Book.pdf',
  },
  bricks: {
    apiPath: '/api/brochure/bricks',
    fallbackPath: ASSETS.bricksPdf,
    filename: 'MAA-Adya-Forge-Refractory-Bricks.pdf',
  },
};

export function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.replace(/\s+/g, '');
  if (typeof atob === 'function') {
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(cleaned, 'base64'));
}

function triggerPdfBlobDownload(bytes: Uint8Array, filename: string): void {
  const pdfBlob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/pdf',
  });
  const blobUrl = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Keep the object URL alive long enough for large multi-MB PDFs to finish saving
  window.setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 60_000);
}

async function fetchVerifiedPdfBytes(url: string): Promise<Uint8Array | null> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/pdf' },
  });
  if (!response.ok) return null;
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return isValidPdfBuffer(bytes) ? bytes : null;
}

export async function downloadBrochurePdf(kind: BrochureKind): Promise<boolean> {
  const config = BROCHURE_CONFIG[kind];
  try {
    if (isStandaloneMode()) {
      const embeddedBase64 = getEmbeddedPdfBase64(kind);
      if (embeddedBase64) {
        const bytes = decodeBase64ToUint8Array(embeddedBase64);
        if (isValidPdfBuffer(bytes)) {
          triggerPdfBlobDownload(bytes, config.filename);
          return true;
        }
      }

      const link = document.createElement('a');
      link.href = resolveAssetUrl(config.fallbackPath);
      link.download = config.filename;
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    let bytes = await fetchVerifiedPdfBytes(config.apiPath);
    if (!bytes) {
      bytes = await fetchVerifiedPdfBytes(config.fallbackPath);
    }
    if (!bytes) {
      return false;
    }

    triggerPdfBlobDownload(bytes, config.filename);
    return true;
  } catch {
    return false;
  }
}
