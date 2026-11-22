import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEO_CONFIG,
  buildRobotsTxt,
  buildSitemapXml,
  buildStructuredDataGraph,
  getAllCatalogProductsForSeo,
  resolveCanonicalUrl,
} from './seo';

test('SEO title and meta description follow search snippet length guidelines', () => {
  assert.ok(
    SEO_CONFIG.title.length >= 30 && SEO_CONFIG.title.length <= 60,
    `Expected title length 30-60 chars, got ${SEO_CONFIG.title.length}: "${SEO_CONFIG.title}"`
  );
  assert.match(SEO_CONFIG.title, /Maa Adya Forge/i);
  assert.match(SEO_CONFIG.title, /Bricks/i);

  assert.ok(
    SEO_CONFIG.description.length >= 120 && SEO_CONFIG.description.length <= 160,
    `Expected description length 120-160 chars, got ${SEO_CONFIG.description.length}`
  );
  assert.match(SEO_CONFIG.description, /Maa Adya Forge/i);
  assert.match(SEO_CONFIG.description, /Chirkunda, Dhanbad/i);
  assert.match(SEO_CONFIG.description, /bricks/i);
  assert.match(SEO_CONFIG.description, /castables/i);
});

test('getAllCatalogProductsForSeo covers all 32 refractory, forging, and automotive items', () => {
  const products = getAllCatalogProductsForSeo();
  assert.equal(products.length, 32);
  const names = products.map((p) => p.name);
  assert.ok(names.includes('Fire Clay IS:6 & IS:8 bricks, blocks & tiles'));
  assert.ok(names.includes('High Alumina Bricks, Blocks and Tiles Upto 90%'));
  assert.ok(names.includes('Low Cement Castables(Up to 94% Alumina)'));
  assert.ok(names.includes('90k Mortars'));
  assert.ok(names.includes('Industrial Forged Rings'));
  assert.ok(names.includes('Connecting Rod'));
});

test('buildStructuredDataGraph outputs valid Schema.org Organization, WebSite, OfferCatalog, and FAQPage', () => {
  const graph = buildStructuredDataGraph('https://maaadyaforge.com');
  assert.equal(graph['@context'], 'https://schema.org');
  assert.equal(graph['@graph'].length, 3);

  const org = graph['@graph'][0] as Record<string, unknown>;
  assert.equal(org.name, 'Maa Adya Forge and Refractories');
  assert.equal(org.telephone, '+91-7033522500');
  assert.equal(org.email, 'maaadyaforge@gmail.com');
  assert.equal(org.url, 'https://maaadyaforge.com/');
  assert.equal(
    org.logo,
    'https://maaadyaforge.com/assets/aistudio/Website_Logo_7cb475ae.jpeg'
  );

  const catalog = org.hasOfferCatalog as { itemListElement: unknown[] };
  assert.equal(catalog.itemListElement.length, 32);

  const faq = graph['@graph'][2] as { '@type': string; mainEntity: unknown[] };
  assert.equal(faq['@type'], 'FAQPage');
  assert.equal(faq.mainEntity.length, 4);
});

test('resolveCanonicalUrl resolves HTTP/HTTPS URLs and skips file:// URLs', () => {
  assert.equal(
    resolveCanonicalUrl('https:', 'https://maaadyaforge.com/', '/'),
    'https://maaadyaforge.com/'
  );
  assert.equal(
    resolveCanonicalUrl('http:', 'http://localhost:3000', '/products'),
    'http://localhost:3000/products'
  );
  assert.equal(resolveCanonicalUrl('file:', 'null', '/C:/index.html'), null);
});

test('buildRobotsTxt and buildSitemapXml emit valid crawler directives', () => {
  const robots = buildRobotsTxt('https://maaadyaforge.com/');
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Sitemap: https:\/\/maaadyaforge\.com\/sitemap\.xml/);

  const sitemap = buildSitemapXml('https://maaadyaforge.com/', '2026-11-21');
  assert.match(sitemap, /<loc>https:\/\/maaadyaforge\.com\/<\/loc>/);
  assert.match(sitemap, /<priority>1\.0<\/priority>/);
});
