import type {
  CatalogItem,
  ColorMode,
  FinishType,
  HardwareFinish,
  PurseBadgeId,
  PurseClaspId,
  PurseConfig,
  PurseHandleId,
  PurseShapeId,
  PurseSizeId,
  PurseTextureId,
} from '../types/store';

/**
 * ============================================================================
 * MAISON 704 — CENTRALIZED EDITABLE STOREFRONT CONFIGURATION
 * ============================================================================
 * Before publishing your final site, update headlines, story paragraphs,
 * product copy/prices, photo URLs, and your time-lapse video URL right here.
 */
export const STOREFRONT_CONFIG = {
  brand: {
    name: 'MAISON 704',
    tagline: 'Charlotte Sculpted Accessories & Custom 3D Atelier',
    city: 'Charlotte, NC',
    boutiqueNeighborhood: 'South End & Dilworth Partner Boutique',
    ownerAdminEmail: 'Johnhenrymckinney@gmail.com',
    freeShippingThreshold: 120,
    flatShippingRate: 8,
  },

  hero: {
    kicker: 'Charlotte Atelier · Online & In-Store Boutique Capsule',
    headline: 'Sculpted Statements,',
    headlineItalic: 'Made in the Queen City.',
    description:
      'Custom 3D-printed handbags, monogrammed bag charms, and elevated personalized lifestyle essentials crafted in Charlotte. Match any outfit with full-spectrum color blends and custom engravings.',
    primaryCta: 'Design Your Purse',
    secondaryCta: 'Explore Collection',
    illustrationUrl: '/src/assets/images/hero_editorial_queen_1795100462963.jpg',
    illustrationAlt:
      'Editorial illustration in Charlotte showcasing a sculpted blue and teal quilted clutch',
  },

  illustratedStories: [
    {
      id: 'story-purses',
      category: 'purses' as const,
      kicker: '01 · Signature Handbags',
      title: 'Multi-Color Sculpted Purses',
      description:
        'Featherlight statement clutches and structured totes customized in solid, two-tone, ombre, tri-color, or dual-silk finishes with your monogram.',
      imageUrl: '/src/assets/images/story_purses_illustration_1795100462993.jpg',
      ctaLabel: 'Open 3D Purse Studio',
      actionTarget: 'purse-studio' as const,
    },
    {
      id: 'story-charms',
      category: 'charms' as const,
      kicker: '02 · Everyday Carry & Accents',
      title: 'Keychains, Charms & Trays',
      description:
        'Custom engraved keychains, bag charms, fluted catchall trays, and valet stands designed for keys, watches, jewelry, or your favorite bag.',
      imageUrl: '/src/assets/images/story_charms_illustration_1795100464161.jpg',
      ctaLabel: 'Shop Keychains & Trays',
      actionTarget: 'collection' as const,
    },
    {
      id: 'story-lifestyle',
      category: 'lifestyle' as const,
      kicker: '03 · Elevated Smoke & Rituals',
      title: 'Grinders, Trays & Sleeves',
      description:
        'Modern, high-craft herb grinders, curved rolling trays, faceted ashtrays, and textured lighter sleeves with custom color themes & engravings.',
      imageUrl: '/src/assets/images/story_lifestyle_illustration_1795100463799.jpg',
      ctaLabel: 'Customize Smoke & Lifestyle',
      actionTarget: 'collection' as const,
    },
  ],

  timeLapse: {
    kicker: 'Inside the Charlotte Atelier',
    title: 'Watch Every Layer Come to Life',
    description:
      'Every Maison 704 purse, charm, and engraved tray is sculpted layer by layer from luminous plant-based bio-polymers, then hand-finished in our Charlotte studio. Swap in your final studio film here before publishing—or preview a local clip right now.',
    /**
     * FINAL PUBLISH STEP:
     * Place your final .mp4 or .webm file in /public/videos/timelapse.mp4
     * and set videoUrl to '/videos/timelapse.mp4' below.
     */
    videoUrl: '',
    posterNote: 'Live Procedural 3D Layer-by-Layer Preview · Ready for Your Final Time-Lapse Film',
    highlights: [
      { label: 'Precision Layers', value: '0.16 mm', detail: 'Velvet-smooth boutique finish' },
      { label: 'Color Engine', value: 'Full Spectrum', detail: 'Two-tone, ombre & silk shift' },
      { label: 'Turnaround', value: '3–5 Days', detail: 'Free Charlotte boutique pickup' },
    ],
  },

  story: {
    kicker: 'Charlotte Crafted · Boutique Partnered',
    headline: 'Designed for the Boutique, Personalized for Your Style.',
    paragraphs: [
      'Born in Charlotte, Maison 704 brings together boutique fashion sensibility and modern 3D sculptural artistry. Each piece is printed to order in featherlight, renewable bio-polymers and finished by hand with brushed silver, obsidian, or champagne hardware.',
      'Shop our featured purse capsules in person at our partner clothing boutique in Charlotte, or customize any colorway, multi-tone blend, and personal engraving across handbags, everyday carry, and lifestyle essentials online with free local pickup or insured nationwide shipping.',
    ],
    pillars: [
      {
        title: 'In-Store Partner Boutique',
        body: 'Experience our signature sculpted purses and curated seasonal drops in person right here in Charlotte.',
      },
      {
        title: 'Full-Spectrum Color Match',
        body: 'From Charlotte electric blue and vibrant teal to any custom shade, blend two tones, tri-color fades, or silk gradients.',
      },
      {
        title: 'Custom Personal Engravings',
        body: 'Add initials, names, or signature phrases across purses, keychains, catchall trays, grinders, rolling trays, and lighter sleeves.',
      },
      {
        title: 'Free Local Pickup & Shipping',
        body: 'Complimentary Charlotte pickup or insured US delivery (free on orders over $120).',
      },
    ],
  },
};

export interface ColorSwatch {
  id: string;
  name: string;
  hex: string;
  group: 'Charlotte' | 'Editorial' | 'Pastel & Luxe';
}

export const CURATED_SWATCHES: ColorSwatch[] = [
  // Charlotte Signature Palette (Blue, Teal, Black, White, Grey/Silver)
  { id: 'carolina-blue', name: 'Carolina Blue', hex: '#0085CA', group: 'Charlotte' },
  { id: 'queen-teal', name: 'Charlotte Teal', hex: '#009CA6', group: 'Charlotte' },
  { id: 'obsidian-noir', name: 'Obsidian Black', hex: '#141920', group: 'Charlotte' },
  { id: 'ice-white', name: 'Ice Pearl White', hex: '#F4F7FA', group: 'Charlotte' },
  { id: 'silver-mist', name: 'Cool Silver', hex: '#B8C4D0', group: 'Charlotte' },
  { id: 'slate-graphite', name: 'Graphite Grey', hex: '#475569', group: 'Charlotte' },
  // Editorial Full-Spectrum Favorites
  { id: 'electric-cobalt', name: 'Royal Cobalt', hex: '#1D4ED8', group: 'Editorial' },
  { id: 'aqua-lagoon', name: 'Aqua Mint', hex: '#14B8A6', group: 'Editorial' },
  { id: 'midnight-navy', name: 'Midnight Navy', hex: '#1E293B', group: 'Editorial' },
  { id: 'emerald-luxe', name: 'Emerald Luxe', hex: '#059669', group: 'Editorial' },
  { id: 'amethyst-velvet', name: 'Royal Plum', hex: '#6D28D9', group: 'Editorial' },
  { id: 'crimson-noir', name: 'Deep Ruby', hex: '#9F1239', group: 'Editorial' },
  // Soft Editorial & Metallic Accents
  { id: 'sky-ice', name: 'Glacier Sky', hex: '#7DD3FC', group: 'Pastel & Luxe' },
  { id: 'seafoam-pearl', name: 'Seafoam Pearl', hex: '#5EEAD4', group: 'Pastel & Luxe' },
  { id: 'lilac-cloud', name: 'Soft Lilac', hex: '#C4B5FD', group: 'Pastel & Luxe' },
  { id: 'champagne-gold', name: 'Champagne Gold', hex: '#D6B082', group: 'Pastel & Luxe' },
  { id: 'amber-bronze', name: 'Warm Bronze', hex: '#B47B44', group: 'Pastel & Luxe' },
  { id: 'sunset-peach', name: 'Apricot Glow', hex: '#FB923C', group: 'Pastel & Luxe' },
];

export const MULTI_COLOR_PAIRINGS: Array<{
  id: string;
  name: string;
  mode: ColorMode;
  primaryHex: string;
  secondaryHex: string;
  tertiaryHex?: string;
  finish: FinishType;
  hardwareFinish: HardwareFinish;
}> = [
  {
    id: 'queen-city-duo',
    name: 'Queen City Blue & Teal',
    mode: 'two-tone',
    primaryHex: '#0085CA',
    secondaryHex: '#009CA6',
    tertiaryHex: '#F4F7FA',
    finish: 'silk',
    hardwareFinish: 'silver',
  },
  {
    id: 'queen-city-tri',
    name: 'Blue · Teal · Ice Trio',
    mode: 'tri-color',
    primaryHex: '#0085CA',
    secondaryHex: '#009CA6',
    tertiaryHex: '#F4F7FA',
    finish: 'silk',
    hardwareFinish: 'silver',
  },
  {
    id: 'uptown-noir-blue',
    name: 'Obsidian · Blue · Silver',
    mode: 'tri-color',
    primaryHex: '#141920',
    secondaryHex: '#0085CA',
    tertiaryHex: '#B8C4D0',
    finish: 'metallic',
    hardwareFinish: 'silver',
  },
  {
    id: 'teal-ice-ombre',
    name: 'Teal to Ice Ombre',
    mode: 'ombre',
    primaryHex: '#009CA6',
    secondaryHex: '#E2EFF5',
    tertiaryHex: '#141920',
    finish: 'pearl',
    hardwareFinish: 'silver',
  },
  {
    id: 'electric-silk-shift',
    name: 'Cobalt-Teal Silk Shift',
    mode: 'dual-silk',
    primaryHex: '#0085CA',
    secondaryHex: '#14B8A6',
    tertiaryHex: '#F4F7FA',
    finish: 'silk',
    hardwareFinish: 'silver',
  },
  {
    id: 'silver-pearl-solid',
    name: 'Ice Pearl & Graphite',
    mode: 'two-tone',
    primaryHex: '#F4F7FA',
    secondaryHex: '#475569',
    tertiaryHex: '#0085CA',
    finish: 'pearl',
    hardwareFinish: 'obsidian',
  },
];

export const PURSE_SILHOUETTES: Array<{
  id: PurseShapeId;
  name: string;
  vibe: string;
  iconPath: string;
}> = [
  {
    id: 'heart',
    name: 'Sculpted Heart',
    vibe: 'Signature boutique icon',
    iconPath:
      'M12 20 C6.5 16 4 12.2 4 8.5 C4 5.8 6.2 4 8.6 4 C10.2 4 11.4 4.8 12 6 C12.6 4.8 13.8 4 15.4 4 C17.8 4 20 5.8 20 8.5 C20 12.2 17.5 16 12 20 Z',
  },
  {
    id: 'tote',
    name: 'Structured Kelly Tote',
    vibe: 'Timeless architectural box',
    iconPath: 'M5 8 H19 L20 19 H4 Z M9 8 V6 A3 3 0 0 1 15 6 V8',
  },
  {
    id: 'octagon',
    name: 'Emerald Octagon',
    vibe: 'Faceted luxury clutch',
    iconPath: 'M8 3 H16 L21 8 V16 L16 21 H8 L3 16 V8 Z',
  },
  {
    id: 'star5',
    name: 'Starlight 5-Point',
    vibe: 'Night-out showstopper',
    iconPath:
      'M12 3 L14.6 8.8 L21 9.5 L16.2 13.8 L17.6 20 L12 16.8 L6.4 20 L7.8 13.8 L3 9.5 L9.4 8.8 Z',
  },
  {
    id: 'crescent',
    name: 'Half-Moon Crescent',
    vibe: 'Modern curved silhouette',
    iconPath:
      'M4 9 C4 16 8 20 12 20 C16 20 20 16 20 9 C17 12 15 13 12 13 C9 13 7 12 4 9 Z',
  },
  {
    id: 'diamond',
    name: 'Diamond Facet',
    vibe: 'Jewel-cut statement',
    iconPath: 'M12 3 L20 12 L12 21 L4 12 Z',
  },
  {
    id: 'scallop',
    name: 'Cloud Scallop',
    vibe: 'Soft sculpted waves',
    iconPath:
      'M7 18 H17 A4 4 0 0 0 18 10.5 A5 5 0 0 0 8.5 8.5 A4 4 0 0 0 7 18 Z',
  },
  {
    id: 'drum',
    name: 'Pearl Vanity Drum',
    vibe: 'Chic round hatbox',
    iconPath: 'M12 4 A8 8 0 1 0 12 20 A8 8 0 1 0 12 4 Z',
  },
];

export const PURSE_SIZES: Array<{
  id: PurseSizeId;
  name: string;
  guidance: string;
  popular?: boolean;
  priceDelta: number;
  width: number;
  height: number;
  depth: number;
  lidHeight: number;
}> = [
  {
    id: 'mini',
    name: 'Mini Clutch',
    guidance: 'Holds cards, keys, earbuds & compact essentials',
    priceDelta: -8,
    width: 132,
    height: 84,
    depth: 62,
    lidHeight: 20,
  },
  {
    id: 'everyday',
    name: 'Everyday Boutique',
    guidance: 'Fits iPhone Pro Max, wallet, keys & daily essentials comfortably',
    popular: true,
    priceDelta: 0,
    width: 162,
    height: 102,
    depth: 74,
    lidHeight: 24,
  },
  {
    id: 'statement',
    name: 'Statement Roomy',
    guidance: 'Spacious night-out silhouette for phone, shades & extras',
    priceDelta: 10,
    width: 188,
    height: 118,
    depth: 84,
    lidHeight: 28,
  },
];

export const PURSE_TEXTURES: Array<{
  id: PurseTextureId;
  name: string;
  vibe: string;
  depth: number;
}> = [
  { id: 'quilt', name: 'Diamond Quilted', vibe: 'Plush luxury cushion', depth: 2.2 },
  { id: 'chevron', name: 'Chevron Ribbed', vibe: 'Tailored V-waves', depth: 2.0 },
  { id: 'woven', name: 'Basketweave', vibe: 'Resort woven detail', depth: 1.9 },
  { id: 'pleats', name: 'Fluted Pleats', vibe: 'Architectural verticals', depth: 1.8 },
  { id: 'smooth', name: 'Satin Smooth', vibe: 'Sleek minimalist shell', depth: 0 },
];

export const PURSE_HANDLES: Array<{
  id: PurseHandleId;
  name: string;
  desc: string;
  priceDelta: number;
}> = [
  { id: 'lid_arch', name: 'Top Arch Handle', desc: 'Sculpted top carry', priceDelta: 4 },
  { id: 'side_loops', name: 'Crossbody Loops', desc: 'Ready for silver/gold chain', priceDelta: 4 },
  { id: 'both', name: 'Handle + Chain Loops', desc: 'Versatile day-to-night', priceDelta: 8 },
  { id: 'none', name: 'Handheld Clutch', desc: 'Clean evening profile', priceDelta: 0 },
];

export const PURSE_CLASPS: Array<{
  id: PurseClaspId;
  name: string;
  desc: string;
  priceDelta: number;
}> = [
  { id: 'snap', name: 'Signature Clasp', desc: 'Classic front closure accent', priceDelta: 0 },
  { id: 'magnetic', name: 'Hidden Magnetic', desc: 'Seamless clean rim', priceDelta: 4 },
];

export const PURSE_BADGES: Array<{ id: PurseBadgeId; name: string }> = [
  { id: 'shield', name: 'Crest Shield' },
  { id: 'circle', name: 'Medallion' },
  { id: 'plaque', name: 'Boutique Bar' },
  { id: 'diamond', name: 'Diamond Cut' },
  { id: 'none', name: 'No Plaque' },
];

export const FINISH_OPTIONS: Array<{
  id: FinishType;
  name: string;
  desc: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
}> = [
  { id: 'silk', name: 'Luminous Silk', desc: 'Signature 3D shimmer', roughness: 0.28, metalness: 0.24, clearcoat: 0.35 },
  { id: 'matte', name: 'Velvet Matte', desc: 'Soft boutique satin', roughness: 0.52, metalness: 0.05, clearcoat: 0.05 },
  { id: 'pearl', name: 'Pearl Gloss', desc: 'Polished lacquer glow', roughness: 0.16, metalness: 0.12, clearcoat: 0.85 },
  { id: 'metallic', name: 'Liquid Chrome', desc: 'High-shine metallic', roughness: 0.2, metalness: 0.68, clearcoat: 0.5 },
];

export const HARDWARE_OPTIONS: Array<{
  id: HardwareFinish;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
}> = [
  { id: 'silver', name: 'Brushed Silver', hex: '#D8E0E8', metalness: 0.78, roughness: 0.22 },
  { id: 'obsidian', name: 'Obsidian Gloss', hex: '#181F28', metalness: 0.45, roughness: 0.24 },
  { id: 'gold', name: 'Champagne Gold', hex: '#D8B488', metalness: 0.72, roughness: 0.24 },
  { id: 'matched', name: 'Color-Matched', hex: '#009CA6', metalness: 0.32, roughness: 0.28 },
];

export const DEFAULT_PURSE_CONFIG: PurseConfig = {
  shape: 'heart',
  size: 'everyday',
  texture: 'quilt',
  colorMode: 'two-tone',
  primaryHex: '#0085CA',
  secondaryHex: '#009CA6',
  tertiaryHex: '#F4F7FA',
  finish: 'silk',
  hardwareFinish: 'silver',
  handle: 'lid_arch',
  clasp: 'snap',
  badge: 'shield',
  monogram: 'CLT',
  lidAngle: 18,
  giftNote: '',
};

export function calculatePursePrice(cfg: PurseConfig): number {
  const sz = PURSE_SIZES.find((s) => s.id === cfg.size) ?? PURSE_SIZES[1];
  const hdl = PURSE_HANDLES.find((h) => h.id === cfg.handle) ?? PURSE_HANDLES[0];
  const clp = PURSE_CLASPS.find((c) => c.id === cfg.clasp) ?? PURSE_CLASPS[0];
  let price = 76 + sz.priceDelta + hdl.priceDelta + clp.priceDelta;
  if (cfg.colorMode === 'tri-color') price += 8;
  else if (cfg.colorMode !== 'solid') price += 6;
  if (cfg.badge !== 'none' && cfg.monogram.trim().length > 0) price += 4;
  return Math.max(68, Math.min(112, price));
}

export const CATALOG_ITEMS: CatalogItem[] = [
  // Statement Purses & Clutches
  {
    id: 'uptown-heart-clutch',
    slot: '01',
    name: 'Uptown Quilted Heart Clutch',
    category: 'purses',
    subtitle: 'Carolina Blue & Teal Two-Tone · Monogram Included',
    price: 86,
    isPurse: true,
    defaultPrimaryHex: '#0085CA',
    defaultAccentHex: '#009CA6',
    photoUrl: '',
    pursePreset: {
      shape: 'heart',
      size: 'everyday',
      texture: 'quilt',
      colorMode: 'two-tone',
      primaryHex: '#0085CA',
      secondaryHex: '#009CA6',
      finish: 'silk',
      hardwareFinish: 'silver',
      handle: 'lid_arch',
      clasp: 'snap',
      badge: 'shield',
      monogram: 'CLT',
    },
  },
  {
    id: 'southend-kelly-tote',
    slot: '02',
    name: 'South End Structured Mini Tote',
    category: 'purses',
    subtitle: 'Obsidian & Cool Silver · Crossbody Ready',
    price: 88,
    isPurse: true,
    defaultPrimaryHex: '#141920',
    defaultAccentHex: '#B8C4D0',
    photoUrl: '',
    pursePreset: {
      shape: 'tote',
      size: 'everyday',
      texture: 'chevron',
      colorMode: 'two-tone',
      primaryHex: '#141920',
      secondaryHex: '#B8C4D0',
      finish: 'metallic',
      hardwareFinish: 'silver',
      handle: 'both',
      clasp: 'snap',
      badge: 'plaque',
      monogram: 'M704',
    },
  },
  {
    id: 'dilworth-teal-ombre',
    slot: '03',
    name: 'Dilworth Faceted Ombre Clutch',
    category: 'purses',
    subtitle: 'Teal-to-Pearl Ombre · Magnetic Closure',
    price: 84,
    isPurse: true,
    defaultPrimaryHex: '#009CA6',
    defaultAccentHex: '#F4F7FA',
    photoUrl: '',
    pursePreset: {
      shape: 'octagon',
      size: 'everyday',
      texture: 'smooth',
      colorMode: 'ombre',
      primaryHex: '#009CA6',
      secondaryHex: '#F4F7FA',
      finish: 'pearl',
      hardwareFinish: 'silver',
      handle: 'side_loops',
      clasp: 'magnetic',
      badge: 'diamond',
      monogram: 'QC',
    },
  },
  {
    id: 'atherton-starlight-bag',
    slot: '04',
    name: 'Atherton Starlight Night-Out Bag',
    category: 'purses',
    subtitle: 'Dual-Silk Blue & Mint · Statement Silhouette',
    price: 92,
    isPurse: true,
    defaultPrimaryHex: '#0085CA',
    defaultAccentHex: '#14B8A6',
    photoUrl: '',
    pursePreset: {
      shape: 'star5',
      size: 'statement',
      texture: 'pleats',
      colorMode: 'dual-silk',
      primaryHex: '#0085CA',
      secondaryHex: '#14B8A6',
      finish: 'silk',
      hardwareFinish: 'silver',
      handle: 'side_loops',
      clasp: 'snap',
      badge: 'circle',
      monogram: 'LUX',
    },
  },

  // Keychains, Bag Charms & Everyday Organizers
  {
    id: 'queen-crown-charm',
    slot: '05',
    name: 'Charlotte Crown Keychain & Bag Charm',
    category: 'charms',
    subtitle: 'Engraved Initial Tag · Clips to Keys, Totes & Bags',
    price: 24,
    isPurse: false,
    accessoryKind: 'bag-charm',
    maxEngravingChars: 6,
    defaultPrimaryHex: '#009CA6',
    defaultAccentHex: '#B8C4D0',
    defaultEngraving: 'CLT',
    photoUrl: '',
  },
  {
    id: 'sculpted-heart-keychain',
    slot: '06',
    name: 'Monogram Sculpted Heart Keychain',
    category: 'charms',
    subtitle: 'Two-Tone Custom Name or Initials · Everyday Keyring',
    price: 22,
    isPurse: false,
    accessoryKind: 'keychain',
    maxEngravingChars: 8,
    defaultPrimaryHex: '#0085CA',
    defaultAccentHex: '#F4F7FA',
    defaultEngraving: '704',
    photoUrl: '',
  },
  {
    id: 'fluted-vanity-tray',
    slot: '07',
    name: 'Myers Park Fluted Catchall Tray',
    category: 'charms',
    subtitle: 'Custom Engraved Center · Keys, Watch & Jewelry Dish',
    price: 44,
    isPurse: false,
    accessoryKind: 'vanity-tray',
    maxEngravingChars: 14,
    defaultPrimaryHex: '#F4F7FA',
    defaultAccentHex: '#0085CA',
    defaultEngraving: 'MAISON 704',
    photoUrl: '',
  },
  {
    id: 'sculpted-earring-stand',
    slot: '08',
    name: 'Sculpted Arch Valet & Display Stand',
    category: 'charms',
    subtitle: 'Obsidian & Silver Trim · Personalized Base',
    price: 38,
    isPurse: false,
    accessoryKind: 'earring-stand',
    maxEngravingChars: 12,
    defaultPrimaryHex: '#141920',
    defaultAccentHex: '#009CA6',
    defaultEngraving: '704 STUDIO',
    photoUrl: '',
  },

  // Custom Smoke & Lifestyle Accessories (Gender-Neutral Architectural Craft)
  {
    id: 'fluted-herb-grinder',
    slot: '09',
    name: 'Fluted 4-Piece Herb Grinder',
    category: 'lifestyle',
    subtitle: 'Precision Grip · Custom Lid Engraving & Multi-Color Chamber',
    price: 36,
    isPurse: false,
    accessoryKind: 'grinder',
    maxEngravingChars: 10,
    defaultPrimaryHex: '#009CA6',
    defaultAccentHex: '#141920',
    defaultEngraving: 'CHILL',
    photoUrl: '',
  },
  {
    id: 'curved-rolling-tray',
    slot: '10',
    name: 'Sculpted Curved Rolling Tray',
    category: 'lifestyle',
    subtitle: 'Two-Tone Rim · Custom Engraved Center',
    price: 42,
    isPurse: false,
    accessoryKind: 'rolling-tray',
    maxEngravingChars: 16,
    defaultPrimaryHex: '#0085CA',
    defaultAccentHex: '#F4F7FA',
    defaultEngraving: 'CLT 704',
    photoUrl: '',
  },
  {
    id: 'faceted-ash-tray',
    slot: '11',
    name: 'Faceted Geometric Ash Tray',
    category: 'lifestyle',
    subtitle: 'Obsidian & Teal Contrast · Custom Center Engraving',
    price: 34,
    isPurse: false,
    accessoryKind: 'ashtray',
    maxEngravingChars: 10,
    defaultPrimaryHex: '#141920',
    defaultAccentHex: '#009CA6',
    defaultEngraving: '704 STUDIO',
    photoUrl: '',
  },
  {
    id: 'quilted-lighter-sleeve',
    slot: '12',
    name: 'Textured Grip Lighter Sleeve',
    category: 'lifestyle',
    subtitle: 'Snug Standard Fit · Engraved Vertical Initials',
    price: 18,
    isPurse: false,
    accessoryKind: 'lighter-sleeve',
    maxEngravingChars: 6,
    defaultPrimaryHex: '#0085CA',
    defaultAccentHex: '#B8C4D0',
    defaultEngraving: 'CLT',
    photoUrl: '',
  },
];
