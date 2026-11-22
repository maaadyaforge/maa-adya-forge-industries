declare global {
  interface Window {
    __MAA_STANDALONE__?: boolean;
  }
}

export type EmbeddedPdfKey = 'main' | 'castables' | 'bricks';

let cachedEmbeddedImages: Record<string, string> | null | undefined;
let cachedEmbeddedPdfs: Partial<Record<EmbeddedPdfKey, string>> | null | undefined;

function readJsonScriptElement<T>(elementId: string): T | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(elementId);
  if (!el || !el.textContent) return null;
  try {
    return JSON.parse(el.textContent) as T;
  } catch {
    return null;
  }
}

export function getEmbeddedImageMap(): Record<string, string> | null {
  if (cachedEmbeddedImages === undefined) {
    cachedEmbeddedImages = readJsonScriptElement<Record<string, string>>(
      'maa-standalone-images'
    );
  }
  return cachedEmbeddedImages;
}

export function getEmbeddedPdfBase64(kind: EmbeddedPdfKey): string | null {
  if (cachedEmbeddedPdfs === undefined) {
    cachedEmbeddedPdfs = readJsonScriptElement<
      Partial<Record<EmbeddedPdfKey, string>>
    >('maa-standalone-pdfs');
  }
  return cachedEmbeddedPdfs?.[kind] ?? null;
}

export function isStandaloneMode(
  protocol?: string,
  standaloneFlag?: boolean
): boolean {
  const activeProtocol =
    protocol ??
    (typeof window !== 'undefined' ? window.location.protocol : 'http:');
  const activeFlag =
    standaloneFlag ??
    (typeof window !== 'undefined' ? Boolean(window.__MAA_STANDALONE__) : false);
  return activeProtocol === 'file:' || activeFlag;
}

/**
 * Resolves root-relative public and src asset paths so they work identically
 * under Vite dev/prod HTTP servers AND when index.html is opened directly from
 * disk (file://) or standalone without external asset folders.
 */
export function resolveAssetUrl(
  assetPath: string,
  protocol?: string,
  standaloneFlag?: boolean,
  embeddedImages?: Record<string, string> | null
): string {
  if (!isStandaloneMode(protocol, standaloneFlag)) {
    return assetPath;
  }
  const activeEmbedded =
    embeddedImages !== undefined ? embeddedImages : getEmbeddedImageMap();
  const embeddedUri = activeEmbedded?.[assetPath];
  if (embeddedUri) {
    return embeddedUri;
  }
  if (assetPath.startsWith('/assets/')) {
    return `./public${assetPath}`;
  }
  if (assetPath.startsWith('/src/')) {
    return `.${assetPath}`;
  }
  return assetPath;
}

export function resolveAssetCandidates(
  assetPath: string,
  protocol?: string,
  standaloneFlag?: boolean,
  embeddedImages?: Record<string, string> | null
): string[] {
  if (!isStandaloneMode(protocol, standaloneFlag)) {
    return [assetPath];
  }
  const candidates: string[] = [];
  const activeEmbedded =
    embeddedImages !== undefined ? embeddedImages : getEmbeddedImageMap();
  const embeddedUri = activeEmbedded?.[assetPath];
  if (embeddedUri) {
    candidates.push(embeddedUri);
  }
  if (assetPath.startsWith('/assets/')) {
    candidates.push(`./public${assetPath}`, `.${assetPath}`);
    return candidates;
  }
  if (assetPath.startsWith('/src/')) {
    candidates.push(`.${assetPath}`);
    return candidates;
  }
  candidates.push(assetPath);
  return candidates;
}
