import {
  AUTOMOTIVE_PRODUCTS,
  ESTEEMED_CLIENTS,
  EXPORT_DESTINATIONS,
  FORGING_PRODUCTS,
  PLANT_CONTACT,
  REFRACTORY_CATEGORIES,
  TESTIMONIALS,
} from '../data/catalog';

export const SEO_CONFIG = {
  siteName: 'Maa Adya Forge and Refractories',
  title: 'Maa Adya Forge and Refractories | Refractory Bricks & Forge',
  description:
    'Maa Adya Forge and Refractories in Chirkunda, Dhanbad manufactures high-alumina fire bricks, castables, mortars, metal forgings & auto spares. Request a quote.',
  ogImagePath: '/assets/aistudio/Website_Logo_7cb475ae.jpeg',
  ogImageAlt:
    'Maa Adya Forge and Refractories — Refractory Bricks, Castables & Industrial Forgings',
  keywords: [
    'Maa Adya Forge',
    'Maa Adya Forge and Refractories',
    'Jai Mahadev Fire Bricks',
    'Mahadev Forge',
    'refractory bricks manufacturer India',
    'fire bricks Chirkunda Dhanbad Jharkhand',
    'fire clay bricks IS:6 IS:8',
    'high alumina bricks up to 90%',
    'fire bricks 42% 42D 42SD 40%',
    'precast prefired refractory blocks',
    'mag carbon bricks MgO 85%',
    'refractory castables manufacturer',
    'low cement castables 94% alumina',
    'dense castables 97% alumina',
    'acid resistant high alumina castables',
    'insulating castables',
    'self-flow castables',
    'coil coating castables',
    'gel bonded castables',
    'phosphate bonded plastic refractory',
    'silicon carbide LC castables',
    'DRI plant castables',
    'trough castables',
    'refractory mortars and compounds',
    '90k mortars',
    'air setting mortars',
    'expansive mortars',
    'fire clay mortars',
    'high alumina mortars',
    'silica mortars',
    'magnesia mortars',
    'industrial metal forgings India',
    'industrial forged rings',
    'heavy duty forged shafts and flanges',
    'custom forged steel blocks',
    'automotive forged spares',
    'commercial vehicle drive shafts',
    'universal joint yokes',
    'forged camshaft',
    'drop-forged connecting rod',
    'refractory exporter Nepal Bangladesh South Africa Myanmar',
  ],
} as const;

export const SEO_FAQS = [
  {
    question:
      'What products does Maa Adya Forge and Refractories manufacture?',
    answer:
      'Maa Adya Forge and Refractories manufactures industrial Refractory Bricks & Shapes (Fire Clay IS:6 & IS:8, 40%–42% Fire Bricks, High Alumina Bricks up to 90%, Precast Prefired Blocks, Mag Carbon Bricks), 12 grades of monolithic Castables (Dense up to 97% Alumina, Low Cement, Insulating, Acid Resistant, Self-flow, SiC, DRI Kiln, Trough), 7 types of Refractory Mortars, Industrial Metal Forgings (Forged Rings, Shafts & Flanges, Custom Blocks), and OEM Automotive Spares (Drive Shafts, U-Joint Yokes, Camshafts, Connecting Rods).',
  },
  {
    question:
      'Where is the Maa Adya Forge and Refractories manufacturing plant located?',
    answer: `Our manufacturing plant is located at ${PLANT_CONTACT.address} You can reach our plant sales desk on ${PLANT_CONTACT.helpline} or email ${PLANT_CONTACT.emailOrders}.`,
  },
  {
    question:
      'Does Maa Adya Forge export refractory bricks and forgings internationally?',
    answer:
      'Yes. In addition to supplying leading Indian industrial enterprises including L&T, NTPC, NRL, and BHEL, Maa Adya Forge regularly exports refractory bricks, castables, and forged components to Nepal, Bangladesh, South Africa, and Myanmar.',
  },
  {
    question:
      'How can I download product brochures or request a bulk quotation?',
    answer:
      'You can download the complete Maa Adya Forge Brochure, the Castables Product Data Book, and the Refractory Bricks brochure directly from our website, or submit an official quote request online specifying your product grade, required tonnage/quantity, and delivery site.',
  },
] as const;

export function resolveCanonicalUrl(
  protocol: string,
  origin: string,
  pathname: string
): string | null {
  if (protocol !== 'http:' && protocol !== 'https:') {
    return null;
  }
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanOrigin}${cleanPath}`;
}

export function getAllCatalogProductsForSeo() {
  const refractoryItems = REFRACTORY_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: `Refractories Division — ${category.title}`,
      description: `${item.name} (${item.grade}, Max service temperature ${item.tempRating}) manufactured by Maa Adya Forge and Refractories.`,
      specs: [
        { name: 'Grade / Composition', value: item.grade },
        { name: 'Max Temperature Rating', value: item.tempRating },
      ],
    }))
  );

  const forgingItems = FORGING_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    category: 'Forging Division',
    description: product.description,
    specs: product.specs.map((s) => ({ name: s.label, value: s.value })),
  }));

  const automotiveItems = AUTOMOTIVE_PRODUCTS.map((product) => ({
    id: product.id,
    name: product.name,
    category: 'Automotive OEM Spares',
    description: product.description,
    specs: product.specs.map((s) => ({ name: s.label, value: s.value })),
  }));

  return [...refractoryItems, ...forgingItems, ...automotiveItems];
}

export function buildStructuredDataGraph(siteOrigin?: string) {
  const normalizedOrigin =
    siteOrigin && /^https?:\/\//i.test(siteOrigin)
      ? siteOrigin.replace(/\/+$/, '')
      : undefined;

  const orgId = normalizedOrigin
    ? `${normalizedOrigin}/#organization`
    : '#organization';
  const websiteId = normalizedOrigin
    ? `${normalizedOrigin}/#website`
    : '#website';
  const logoUrl = normalizedOrigin
    ? `${normalizedOrigin}${SEO_CONFIG.ogImagePath}`
    : undefined;

  const allProducts = getAllCatalogProductsForSeo();

  const organizationNode: Record<string, unknown> = {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': orgId,
    name: SEO_CONFIG.siteName,
    alternateName: [
      'Maa Adya Forge',
      'Jai Mahadev Fire Bricks',
      'Mahadev Forge',
    ],
    description: SEO_CONFIG.description,
    foundingDate: '1960',
    telephone: PLANT_CONTACT.helpline,
    email: PLANT_CONTACT.emailOrders,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Nehru Road, Chirkunda',
      addressLocality: 'Dhanbad',
      addressRegion: 'Jharkhand',
      postalCode: '828202',
      addressCountry: 'IN',
    },
    areaServed: [
      { '@type': 'Country', name: 'India' },
      ...EXPORT_DESTINATIONS.map((dest) => ({
        '@type': 'Country',
        name: dest.country,
      })),
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: PLANT_CONTACT.helpline,
      email: PLANT_CONTACT.emailOrders,
      contactType: 'sales',
      areaServed: ['IN', 'NP', 'BD', 'ZA', 'MM'],
      availableLanguage: ['English', 'Hindi'],
    },
    knowsAbout: [
      'Refractory Bricks & Shapes',
      'Fire Clay Bricks IS:6 & IS:8',
      'High Alumina Bricks up to 90%',
      'Mag Carbon Bricks',
      'Refractory Castables',
      'Low Cement & Dense Castables',
      'Refractory Mortars & Compounds',
      'Industrial Metal Forgings',
      'Automotive Forged Spares',
      ...ESTEEMED_CLIENTS.map((c) => c.subtitle),
    ],
    review: TESTIMONIALS.map((item) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: item.name,
        jobTitle: item.role,
      },
      reviewBody: item.quote,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: 5,
        bestRating: 5,
      },
    })),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Maa Adya Forge Refractories, Forging & Automotive Catalog',
      itemListElement: allProducts.map((prod, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: prod.name,
          category: prod.category,
          description: prod.description,
          brand: {
            '@type': 'Brand',
            name: SEO_CONFIG.siteName,
          },
          manufacturer: {
            '@id': orgId,
          },
          additionalProperty: prod.specs.map((spec) => ({
            '@type': 'PropertyValue',
            name: spec.name,
            value: spec.value,
          })),
        },
      })),
    },
  };

  if (normalizedOrigin) {
    organizationNode.url = `${normalizedOrigin}/`;
  }
  if (logoUrl) {
    organizationNode.logo = logoUrl;
    organizationNode.image = logoUrl;
  }

  const websiteNode: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': websiteId,
    name: SEO_CONFIG.siteName,
    alternateName: 'Maa Adya Forge',
    description: SEO_CONFIG.description,
    inLanguage: 'en-IN',
    publisher: {
      '@id': orgId,
    },
  };
  if (normalizedOrigin) {
    websiteNode.url = `${normalizedOrigin}/`;
  }

  const faqNode = {
    '@type': 'FAQPage',
    mainEntity: SEO_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [organizationNode, websiteNode, faqNode],
  };
}

export function buildRobotsTxt(siteOrigin?: string): string {
  const lines = ['User-agent: *', 'Allow: /', 'Disallow: /api/'];
  if (siteOrigin && /^https?:\/\//i.test(siteOrigin)) {
    lines.push(`Sitemap: ${siteOrigin.replace(/\/+$/, '')}/sitemap.xml`);
  }
  return `${lines.join('\n')}\n`;
}

export function buildSitemapXml(siteOrigin: string, lastmodDate = '2026-11-21'): string {
  const cleanOrigin = siteOrigin.replace(/\/+$/, '');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${cleanOrigin}/</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;
}

function upsertMetaTag(
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
): void {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attrName}="${attrValue}"]`
  );
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

/**
 * Dynamically binds canonical URL, OpenGraph URL/image, and JSON-LD origin URLs
 * when served over HTTP/HTTPS without adding broken file:// external links.
 */
export function applyRuntimeSeoMetadata(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const canonical = resolveCanonicalUrl(
    window.location.protocol,
    window.location.origin,
    window.location.pathname
  );
  if (!canonical) return;

  const origin = window.location.origin.replace(/\/+$/, '');
  const fullOgImage = `${origin}${SEO_CONFIG.ogImagePath}`;

  let canonicalLink = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute('href', canonical);

  upsertMetaTag('property', 'og:url', canonical);
  upsertMetaTag('property', 'og:image', fullOgImage);
  upsertMetaTag('name', 'twitter:image', fullOgImage);

  const ldScript = document.head.querySelector<HTMLScriptElement>(
    'script[type="application/ld+json"][data-seo-graph="maa-adya-forge"]'
  );
  if (ldScript) {
    ldScript.textContent = JSON.stringify(buildStructuredDataGraph(origin));
  }
}
