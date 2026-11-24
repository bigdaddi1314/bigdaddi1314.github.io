import type { AccessoryKind, CatalogItem, ProductCategory, PurseShapeId } from '../types/store';

export interface WorkshopCatalogProduct {
  id: string;
  name: string;
  inventoryRef?: string;
  sku?: string;
  category: string;
  categoryLabel: string;
  badge?: string | null;
  featured?: boolean;
  image: string;
  photoStatus?: string;
  description: string;
  dimensions?: string;
  sizes?: { mini: string; medium: string; large: string };
  studioPreset?: string;
  studioColors?: { body?: string; lid?: string; hw?: string };
}

export interface WorkshopCatalogCategory {
  id: string;
  label: string;
}

export interface WorkshopCatalogJson {
  storeName?: string;
  tagline?: string;
  studioBaseUrl?: string;
  imageBasePath?: string;
  updatedAt?: string;
  categories: WorkshopCatalogCategory[];
  products: WorkshopCatalogProduct[];
}

const PRICE_BY_ID: Record<string, number> = {
  'carryall-tote': 96,
  'barrel-duffel': 98,
  'envelope-clutch': 78,
  'pill-clutch': 76,
  'half-moon-clutch': 78,
  'art-deco-clutch': 82,
  'structured-tote': 88,
  'mini-backpack': 94,
  'saddle-bag': 84,
  'drum-crossbody': 82,
  'heart-clutch': 78,
  '5-point-star-clutch': 76,
  '6-point-star-clutch': 76,
  'octagon-clutch': 74,
  'hexagon-clutch': 74,
  'pentagon-clutch': 74,
  'diamond-clutch': 78,
  'triangle-clutch': 74,
  'coffin-clutch': 78,
  'teardrop-clutch': 76,
  'scallop-cloud-clutch': 78,
  'erotic-label-purse': 110,
  'silk-bag-erotic-label': 98,
  'erotic-label-ashtray-cup': 42,
  'erotic-label-ashtray': 36,
  'herb-grinder': 34,
  'lips-floating-shelf': 58,
  'rolling-tray': 44,
  'keychains-and-charms': 22,
  'tactical-grip-lighter-case': 24,
  'elglock-bic-sleeve': 26,
  'lightbox': 64,
  'wall-logo': 68,
  'cashapp-pay-wand': 28,
  'ritual-tray': 46,
  'blank-book-cover': 48,
  'canvas-frame': 38,
  'dollar-sign-model': 32,
  'cash-app-keychain': 20,
  'mm-hairpin': 22,
  'lithophanes': 45,
  'grinch-fishing-grip': 38,
  'lulabu-duck': 28,
  'reebok-pump-shoes': 30,
  'ice-cube': 34,
};

function inferMaisonCategory(p: WorkshopCatalogProduct): Exclude<ProductCategory, 'all'> {
  if (
    p.category === 'signature-41' ||
    p.category === 'bags-crossbodies' ||
    p.category === 'sculptural-clutches' ||
    p.id === 'erotic-label-purse' ||
    p.id === 'silk-bag-erotic-label'
  ) {
    return 'purses';
  }
  if (
    /keychain|charm|hairpin|wand|duck|shoes|dollar-sign|ice-cube/i.test(p.id)
  ) {
    return 'charms';
  }
  return 'lifestyle';
}

function inferAccessoryKind(p: WorkshopCatalogProduct): AccessoryKind | undefined {
  if (/grinder/i.test(p.id)) return 'grinder';
  if (/rolling-tray/i.test(p.id)) return 'rolling-tray';
  if (/ashtray/i.test(p.id)) return 'ashtray';
  if (/lighter|bic-sleeve/i.test(p.id)) return 'lighter-sleeve';
  if (/keychain/i.test(p.id)) return 'keychain';
  if (/charm|hairpin|wand/i.test(p.id)) return 'bag-charm';
  if (/tray|shelf|book|frame/i.test(p.id)) return 'vanity-tray';
  return undefined;
}

function mapToInlinePurseShape(preset?: string): PurseShapeId {
  const map: Record<string, PurseShapeId> = {
    carryall: 'tote',
    duffel: 'drum',
    envelope: 'tote',
    pill: 'drum',
    halfmoon: 'crescent',
    artdeco: 'octagon',
    heart: 'heart',
    mini_backpack: 'tote',
    saddle_bag: 'crescent',
    star5: 'star5',
    star6: 'star5',
    tote: 'tote',
    octagon: 'octagon',
    hex: 'octagon',
    pentagon: 'octagon',
    diamond: 'diamond',
    triangle: 'diamond',
    coffin: 'diamond',
    teardrop: 'heart',
    scallop: 'scallop',
    cylinder: 'drum',
  };
  return (preset && map[preset]) || 'tote';
}

export function buildPurseStudioUrl(
  product: {
    name: string;
    studioPreset?: string;
    primaryHex?: string;
    accentHex?: string;
    lidHex?: string;
    size?: 'mini' | 'medium' | 'large';
  },
  baseUrl = '/purse-studio/index.html'
): string {
  const params = new URLSearchParams();
  if (product.studioPreset) params.set('preset', product.studioPreset);
  if (product.size) params.set('size', product.size);
  if (product.name) params.set('title', product.name);
  if (product.primaryHex && /^#[0-9a-fA-F]{6}$/.test(product.primaryHex)) {
    params.set('body', product.primaryHex);
  }
  if (product.lidHex && /^#[0-9a-fA-F]{6}$/.test(product.lidHex)) {
    params.set('lid', product.lidHex);
  }
  if (product.accentHex && /^#[0-9a-fA-F]{6}$/.test(product.accentHex)) {
    params.set('hw', product.accentHex);
  }
  params.set('from', 'gallery');
  return `${baseUrl}?${params.toString()}`;
}

export async function loadWorkshopCatalog(): Promise<{
  items: CatalogItem[];
  categories: WorkshopCatalogCategory[];
  studioBaseUrl: string;
}> {
  const res = await fetch('/products-catalog.json', { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load /products-catalog.json (${res.status})`);
  }
  const data = (await res.json()) as WorkshopCatalogJson;
  const studioBaseUrl = data.studioBaseUrl || '/purse-studio/index.html';

  const items: CatalogItem[] = (data.products || []).map((p, idx) => {
    const maisonCat = inferMaisonCategory(p);
    const isPurse = maisonCat === 'purses';
    const primaryHex = p.studioColors?.body || '#0085CA';
    const accentHex = p.studioColors?.hw || '#009CA6';
    const lidHex = p.studioColors?.lid || primaryHex;
    const photoUrl = p.image.startsWith('/') ? p.image : `/${p.image}`;
    const studioPreset = p.studioPreset || 'carryall';

    return {
      id: p.id,
      slot: String(idx + 1).padStart(2, '0'),
      name: p.name,
      category: maisonCat,
      workshopCategory: p.category,
      categoryLabel: p.categoryLabel,
      badge: p.badge ?? null,
      sku: p.sku,
      dimensions: p.dimensions,
      inventoryRef: p.inventoryRef,
      subtitle: p.description,
      price: PRICE_BY_ID[p.id] ?? (isPurse ? 78 : 34),
      isPurse,
      accessoryKind: isPurse ? undefined : inferAccessoryKind(p),
      maxEngravingChars: isPurse ? 4 : 12,
      defaultPrimaryHex: primaryHex,
      defaultAccentHex: accentHex,
      defaultEngraving: '',
      photoUrl,
      studioPreset,
      studioUrl: buildPurseStudioUrl(
        {
          name: p.name,
          studioPreset,
          primaryHex,
          lidHex,
          accentHex,
          size: p.sizes ? 'medium' : undefined,
        },
        studioBaseUrl
      ),
      pursePreset: isPurse
        ? {
            shape: mapToInlinePurseShape(studioPreset),
            primaryHex,
            secondaryHex: accentHex,
            monogram: 'M704',
          }
        : undefined,
    };
  });

  return {
    items,
    categories: data.categories || [],
    studioBaseUrl,
  };
}
