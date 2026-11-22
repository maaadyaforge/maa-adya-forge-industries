import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build } from 'vite';
import { buildStructuredDataGraph } from '../src/utils/seo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const indexHtmlPath = path.resolve(rootDir, 'index.html');
const catalogPath = path.resolve(rootDir, 'src/data/catalog.ts');
const legacyStandaloneDir = path.resolve(rootDir, 'public/standalone');

process.env.NODE_ENV = 'production';

function escapeInlineTag(content, tagName) {
  const re = new RegExp(`</${tagName}`, 'gi');
  return content.replace(re, `<\\/${tagName}`);
}

function hasImageMagickConvert() {
  try {
    execFileSync('convert', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function resolveDiskAssetPath(assetUrl) {
  if (assetUrl.startsWith('/assets/')) {
    return path.resolve(rootDir, 'public', assetUrl.slice(1));
  }
  if (assetUrl.startsWith('/src/')) {
    return path.resolve(rootDir, assetUrl.slice(1));
  }
  return null;
}

function collectCatalogImageUrls() {
  const source = fs.readFileSync(catalogPath, 'utf8');
  const assetsBlockMatch = source.match(
    /export const ASSETS\s*=\s*\{([\s\S]*?)\}\s*as const;/
  );
  if (!assetsBlockMatch) {
    throw new Error('Could not locate ASSETS constant in src/data/catalog.ts');
  }
  const urls = new Set();
  const valuePattern = /:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = valuePattern.exec(assetsBlockMatch[1])) !== null) {
    const candidate = match[1];
    if (!candidate.toLowerCase().endsWith('.pdf')) {
      urls.add(candidate);
    }
  }
  return Array.from(urls);
}

function encodeImageToDataUri(assetUrl, diskPath, useConvert) {
  const ext = path.extname(diskPath).toLowerCase();
  if (ext === '.svg') {
    const raw = fs.readFileSync(diskPath);
    return `data:image/svg+xml;base64,${raw.toString('base64')}`;
  }

  if (useConvert && (ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
    const baseName = path.basename(diskPath);
    let maxSize = '720x>';
    let quality = '74';
    if (baseName.startsWith('hero_')) {
      maxSize = '1280x>';
      quality = '72';
    } else if (baseName.startsWith('sub_')) {
      maxSize = '520x>';
      quality = '72';
    } else if (baseName.toLowerCase().includes('logo')) {
      maxSize = '720x>';
      quality = '82';
    }

    try {
      const webpBuf = execFileSync(
        'convert',
        [diskPath, '-resize', maxSize, '-strip', '-quality', quality, 'webp:-'],
        { maxBuffer: 15 * 1024 * 1024 }
      );
      return `data:image/webp;base64,${webpBuf.toString('base64')}`;
    } catch {
      // Fall back to original file bytes if ImageMagick conversion fails
    }
  }

  const raw = fs.readFileSync(diskPath);
  const mime =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';
  return `data:${mime};base64,${raw.toString('base64')}`;
}

function buildEmbeddedAssets() {
  const useConvert = hasImageMagickConvert();
  const imageUrls = collectCatalogImageUrls();
  const embeddedImages = {};
  let imageBytesTotal = 0;

  for (const url of imageUrls) {
    const diskPath = resolveDiskAssetPath(url);
    if (!diskPath || !fs.existsSync(diskPath)) {
      throw new Error(`Missing catalog image asset on disk: ${url}`);
    }
    const dataUri = encodeImageToDataUri(url, diskPath, useConvert);
    embeddedImages[url] = dataUri;
    imageBytesTotal += dataUri.length;
  }

  const pdfMap = {
    main: path.resolve(
      rootDir,
      'public/assets/aistudio/MAA_Adya_Forge_Brochure_cdbe1d6a.pdf'
    ),
    castables: path.resolve(
      rootDir,
      'public/assets/aistudio/Maa_Adya_Forge_-_Castables_Product_Data_Book_35c7e92f.pdf'
    ),
    bricks: path.resolve(
      rootDir,
      'public/assets/aistudio/MAA_ADYA_FORGE_-_Refractory_Bricks_6cca9c82.pdf'
    ),
  };

  const embeddedPdfs = {};
  let pdfBytesTotal = 0;

  for (const [key, pdfPath] of Object.entries(pdfMap)) {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Missing brochure PDF on disk: ${pdfPath}`);
    }
    const pdfBuf = fs.readFileSync(pdfPath);
    if (pdfBuf.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new Error(`Invalid PDF header in ${pdfPath}`);
    }
    const b64 = pdfBuf.toString('base64');
    embeddedPdfs[key] = b64;
    pdfBytesTotal += b64.length;
  }

  return {
    embeddedImages,
    embeddedPdfs,
    imageCount: imageUrls.length,
    imageBytesTotal,
    pdfCount: Object.keys(embeddedPdfs).length,
    pdfBytesTotal,
  };
}

async function buildStandalone() {
  const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'maa-standalone-'));

  try {
    await build({
      root: rootDir,
      mode: 'production',
      cacheDir: path.resolve(rootDir, 'node_modules/.vite-standalone'),
      configFile: false,
      publicDir: false,
      base: './',
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
      },
      build: {
        outDir: tmpOutDir,
        emptyOutDir: true,
        cssCodeSplit: false,
        sourcemap: false,
        minify: 'esbuild',
        lib: {
          entry: path.resolve(rootDir, 'src/main.tsx'),
          name: 'MaaAdyaForgeApp',
          formats: ['iife'],
          fileName: () => 'app.js',
        },
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              if (assetInfo.names?.some((n) => n.endsWith('.css'))) {
                return 'app.css';
              }
              if (assetInfo.name?.endsWith('.css')) {
                return 'app.css';
              }
              return 'assets/[name][extname]';
            },
          },
        },
      },
    });

    const jsPath = path.join(tmpOutDir, 'app.js');
    const cssPath = fs.existsSync(path.join(tmpOutDir, 'app.css'))
      ? path.join(tmpOutDir, 'app.css')
      : path.join(tmpOutDir, 'style.css');

    if (!fs.existsSync(jsPath) || !fs.existsSync(cssPath)) {
      throw new Error('Expected app.js and app.css from standalone Vite build.');
    }

    const rawCss = fs.readFileSync(cssPath, 'utf8');
    const rawJs = fs.readFileSync(jsPath, 'utf8');
    const safeCss = escapeInlineTag(rawCss, 'style');
    const safeJs = escapeInlineTag(rawJs, 'script');

    const {
      embeddedImages,
      embeddedPdfs,
      imageCount,
      imageBytesTotal,
      pdfCount,
      pdfBytesTotal,
    } = buildEmbeddedAssets();

    const safeImagesJson = escapeInlineTag(
      JSON.stringify(embeddedImages),
      'script'
    );
    const safePdfsJson = escapeInlineTag(
      JSON.stringify(embeddedPdfs),
      'script'
    );

    const currentHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const startMarker = '<!-- STANDALONE_BOOT_START -->';
    const endMarker = '<!-- STANDALONE_BOOT_END -->';
    const startIdx = currentHtml.indexOf(startMarker);
    const endIdx = currentHtml.indexOf(endMarker);

    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
      throw new Error(
        'index.html is missing STANDALONE_BOOT_START / STANDALONE_BOOT_END markers.'
      );
    }

    const inlinedBlock = [
      startMarker,
      `<style id="maa-standalone-css">${safeCss}</style>`,
      `<script type="application/json" id="maa-standalone-images">${safeImagesJson}</script>`,
      `<script type="application/json" id="maa-standalone-pdfs">${safePdfsJson}</script>`,
      '<script>window.__MAA_STANDALONE__ = true;</script>',
      `<script id="maa-standalone-js">${safeJs}</script>`,
      endMarker,
    ].join('\n    ');

    let updatedHtml =
      currentHtml.slice(0, startIdx) +
      inlinedBlock +
      currentHtml.slice(endIdx + endMarker.length);

    const seoStartMarker = '<!-- SEO_JSONLD_START -->';
    const seoEndMarker = '<!-- SEO_JSONLD_END -->';
    const seoStartIdx = updatedHtml.indexOf(seoStartMarker);
    const seoEndIdx = updatedHtml.indexOf(seoEndMarker);
    if (seoStartIdx !== -1 && seoEndIdx !== -1 && seoEndIdx > seoStartIdx) {
      const seoGraphJson = escapeInlineTag(
        JSON.stringify(buildStructuredDataGraph()),
        'script'
      );
      const seoBlock = [
        seoStartMarker,
        `<script type="application/ld+json" data-seo-graph="maa-adya-forge">${seoGraphJson}</script>`,
        seoEndMarker,
      ].join('\n    ');
      updatedHtml =
        updatedHtml.slice(0, seoStartIdx) +
        seoBlock +
        updatedHtml.slice(seoEndIdx + seoEndMarker.length);
    }

    fs.writeFileSync(indexHtmlPath, updatedHtml, 'utf8');

    // Clean up old external standalone directory so everything is self-contained inside index.html
    fs.rmSync(legacyStandaloneDir, { recursive: true, force: true });

    console.log(
      `Inlined standalone CSS (${(rawCss.length / 1024).toFixed(1)} KB), JS (${(rawJs.length / 1024).toFixed(1)} KB), ${imageCount} images (${(imageBytesTotal / 1048576).toFixed(2)} MB), and ${pdfCount} PDFs (${(pdfBytesTotal / 1048576).toFixed(2)} MB) into index.html (total ${(updatedHtml.length / 1048576).toFixed(2)} MB)`
    );
  } finally {
    fs.rmSync(tmpOutDir, { recursive: true, force: true });
  }
}

buildStandalone().catch((err) => {
  console.error('Failed to build standalone bundle:', err);
  process.exit(1);
});
