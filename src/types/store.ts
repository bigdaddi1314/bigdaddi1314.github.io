export type ProductCategory =
  | 'all'
  | 'signature-41'
  | 'bags-crossbodies'
  | 'sculptural-clutches'
  | 'erotic-label'
  | 'custom-studio'
  | 'purses'
  | 'charms'
  | 'lifestyle';

export type ColorMode = 'solid' | 'two-tone' | 'ombre' | 'dual-silk' | 'tri-color';
export type FinishType = 'matte' | 'silk' | 'pearl' | 'metallic';
export type HardwareFinish = 'silver' | 'obsidian' | 'gold' | 'matched';
export type EngravingFont = 'editorial' | 'script' | 'modern';

export type PurseShapeId =
  | 'heart'
  | 'tote'
  | 'star5'
  | 'octagon'
  | 'crescent'
  | 'diamond'
  | 'scallop'
  | 'drum';

export type PurseSizeId = 'mini' | 'everyday' | 'statement';
export type PurseTextureId = 'quilt' | 'chevron' | 'woven' | 'pleats' | 'smooth';
export type PurseHandleId = 'lid_arch' | 'side_loops' | 'both' | 'none';
export type PurseClaspId = 'snap' | 'magnetic';
export type PurseBadgeId = 'shield' | 'circle' | 'plaque' | 'diamond' | 'none';

export type AccessoryKind =
  | 'grinder'
  | 'rolling-tray'
  | 'ashtray'
  | 'lighter-sleeve'
  | 'keychain'
  | 'bag-charm'
  | 'vanity-tray'
  | 'earring-stand';

export interface PurseConfig {
  shape: PurseShapeId;
  size: PurseSizeId;
  texture: PurseTextureId;
  colorMode: ColorMode;
  primaryHex: string;
  secondaryHex: string;
  tertiaryHex?: string;
  finish: FinishType;
  hardwareFinish: HardwareFinish;
  handle: PurseHandleId;
  clasp: PurseClaspId;
  badge: PurseBadgeId;
  monogram: string;
  lidAngle: number;
  giftNote: string;
}

export interface AccessoryConfig {
  productId: string;
  productName: string;
  accessoryKind: AccessoryKind;
  colorMode: 'solid' | 'two-tone' | 'ombre';
  primaryHex: string;
  accentHex: string;
  finish: FinishType;
  engravingText: string;
  engravingFont: EngravingFont;
  basePrice: number;
}

export interface CatalogItem {
  id: string;
  slot: string;
  name: string;
  category: Exclude<ProductCategory, 'all'>;
  workshopCategory?: string;
  categoryLabel?: string;
  badge?: string | null;
  sku?: string;
  dimensions?: string;
  inventoryRef?: string;
  subtitle: string;
  price: number;
  isPurse: boolean;
  accessoryKind?: AccessoryKind;
  maxEngravingChars?: number;
  defaultPrimaryHex: string;
  defaultAccentHex: string;
  defaultEngraving?: string;
  photoUrl: string; // Owner can drop real photos into public/images/products/ to swap automatically
  studioPreset?: string;
  studioUrl?: string;
  pursePreset?: Partial<PurseConfig>;
}

export type PrintReliefStyle = 'emboss' | 'deboss' | 'flush';

export const PATTERN_HANDOFF_KEY = 'm704_pattern_handoff';

export interface PatternHandoffPayload {
  svgData: string;
  previewDataUrl: string;
  productId: string;
  productName: string;
  productPrice?: number;
  photoUrl?: string;
  primaryHex?: string;
  secondaryHex?: string;
  bagItemId?: string;
  reliefMode: PrintReliefStyle;
  filamentColor: string;
  sourceFileName?: string;
  customText?: string;
  returnToCheckout: boolean;
}

export interface ItemPersonalization {
  customText: string;
  textFont: 'editorial' | 'modern' | 'script' | 'mono';
  textSize: number;
  textYOffset: number;
  reliefStyle: PrintReliefStyle;
  artworkColorHex: string;
  secondaryColorHex?: string;
  sourceFileName?: string;
  vectorMode?: 'logo' | 'photo' | 'stamp';
  patternMode?: string;
  isFullPattern?: boolean;
  scalePct: number;
  rotationDeg: number;
  offsetXPct: number;
  offsetYPct: number;
  customSvg?: string;
  previewDataUrl?: string;
}

export interface BagItem {
  key: string;
  productId?: string;
  name: string;
  kind: 'purse' | 'accessory' | 'catalog';
  price: number;
  qty: number;
  primaryHex: string;
  secondaryHex: string;
  details: string;
  photoUrl?: string;
  personalization?: ItemPersonalization;
}

export interface SavedDesignRecord {
  id: string;
  userId: string;
  kind: 'purse' | 'accessory';
  name: string;
  summary: string;
  primaryHex: string;
  secondaryHex: string;
  price: number;
  config: Record<string, unknown>;
  createdAt?: unknown;
}

export interface OrderRecord {
  id: string;
  userId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillment: 'pickup' | 'shipping';
  items: Array<{
    name: string;
    qty: number;
    price: number;
    details: string;
    primaryHex: string;
    secondaryHex: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: 'received' | 'printing' | 'ready' | 'completed';
  createdAt?: unknown;
}

export interface BespokeRequestRecord {
  id: string;
  userId: string;
  category: string;
  neededByDate: string;
  notes: string;
  referenceFileName: string;
  customerName: string;
  customerEmail: string;
  instagramHandle: string;
  status: 'submitted' | 'reviewed' | 'quoted';
  createdAt?: unknown;
}

export interface SiteStoryOverride {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface SiteSettingsRecord {
  brandName: string;
  tagline: string;
  city: string;
  heroKicker: string;
  heroHeadline: string;
  heroHeadlineItalic: string;
  heroDescription: string;
  heroIllustrationUrl: string;
  timeLapseTitle: string;
  timeLapseDescription: string;
  timeLapseVideoUrl: string;
  stories: SiteStoryOverride[];
  storyHeadline: string;
  storyParagraphs: string[];
  updatedAt?: unknown;
}

export interface CatalogOverrideRecord {
  itemId: string;
  name: string;
  subtitle: string;
  price: number;
  defaultEngraving: string;
  photoUrl: string;
  updatedAt?: unknown;
}

export interface CommunityInspirationRecord {
  id: string;
  userId: string;
  sourceDesignId: string;
  creatorName: string;
  kind: 'purse' | 'accessory';
  name: string;
  summary: string;
  primaryHex: string;
  secondaryHex: string;
  price: number;
  config: Record<string, unknown>;
  isPublic: boolean;
  createdAt?: unknown;
}

export interface BoutiqueAccessConfig {
  storeName: string;
  storeOwnerEmail: string;
  partnerUsername?: string;
  partnerUid?: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSheetSyncAt: string;
  updatedAt?: unknown;
}

export interface BoutiqueInventoryItem {
  id: string;
  itemId: string;
  productName: string;
  category: Exclude<ProductCategory, 'all'>;
  unitPrice: number;
  inStock: number;
  soldCount: number;
  restockThreshold: number;
  colorwayNote: string;
  partnerEmail: string;
  partnerUid?: string;
  updatedBy: string;
  updatedAt?: unknown;
}

export interface BoutiqueSaleEvent {
  id: string;
  saleId: string;
  itemId: string;
  productName: string;
  eventType: 'sale' | 'restock' | 'adjustment';
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  note: string;
  partnerEmail: string;
  partnerUid?: string;
  recordedByName: string;
  recordedByEmail: string;
  syncedToSheet: boolean;
  createdAt?: unknown;
}




