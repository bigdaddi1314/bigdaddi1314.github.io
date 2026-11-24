import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Compass,
  Film,
  Flame,
  Home,
  KeyRound,
  Layers,
  Lock,
  MessageSquarePlus,
  ShoppingBag,
  Sparkles,
  Store,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  CATALOG_ITEMS,
  DEFAULT_PURSE_CONFIG,
  MULTI_COLOR_PAIRINGS,
  PURSE_SILHOUETTES,
  PURSE_SIZES,
  STOREFRONT_CONFIG,
  calculatePursePrice,
} from './config/storefrontConfig';
import { loadWorkshopCatalog } from './services/catalogLoader';
import { recordBoutiqueOrder, recordCustomRequest } from './services/managementStore';
import type {
  AccessoryConfig,
  BagItem,
  CatalogItem,
  ItemPersonalization,
  ProductCategory,
  PurseConfig,
} from './types/store';
import { AccessoryCustomizerDrawer } from './components/AccessoryCustomizerDrawer';
import { BoutiqueCatalog } from './components/BoutiqueCatalog';
import { CustomRequestSection } from './components/CustomRequestSection';
import { MadeInAtelierGallery } from './components/MadeInAtelierGallery';
import { MonogramPatternStudioView } from './components/MonogramPatternStudioView';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallControl';
import {
  ProductPersonalizerModal,
  type PersonalizerTarget,
} from './components/ProductPersonalizerModal';
import { Purse3DViewport } from './components/Purse3DViewport';
import { PurseDesignStudio } from './components/PurseDesignStudio';
import { ShoppingBagDrawer } from './components/ShoppingBagDrawer';
import { TimeLapseShowcase } from './components/TimeLapseShowcase';

const BAG_STORAGE_KEY = 'maison704_boutique_bag_v1';
const SAVED_DESIGNS_KEY = 'maison704_saved_designs_v1';
const STUDIO_URL = '/purse-studio/index.html?from=gallery';

function readInitialView(): 'shop' | 'pattern-studio' {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('studio') === 'monogram' || window.location.hash === '#monogram-studio') {
      return 'pattern-studio';
    }
  } catch {
    // Ignore URL parse errors
  }
  return 'shop';
}

function readStoredBag(): BagItem[] {
  try {
    const raw = localStorage.getItem(BAG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function App() {
  // Active storefront view ('shop' vs embedded 'pattern-studio')
  const [activeView, setActiveView] = useState<'shop' | 'pattern-studio'>(readInitialView);
  const [patternStudioItemName, setPatternStudioItemName] = useState<string | null>(null);
  const [atelierTab, setAtelierTab] = useState<'purse' | 'bespoke' | 'timelapse'>('purse');

  // Navigation & catalog state (populated from /products-catalog.json)
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('all');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(CATALOG_ITEMS);

  // Inline 3D Purse Studio state (synced with hero live 3D spotlight)
  const [purseConfig, setPurseConfig] = useState<PurseConfig>(DEFAULT_PURSE_CONFIG);

  // Accessory Customizer Drawer state
  const [activeAccessoryItem, setActiveAccessoryItem] = useState<CatalogItem | null>(null);
  const [activeAccessoryInit, setActiveAccessoryInit] = useState<AccessoryConfig | null>(null);

  // Boutique Bag state (localStorage, 100% static)
  const [bagItems, setBagItems] = useState<BagItem[]>(readStoredBag);
  const [isBagOpen, setIsBagOpen] = useState(false);

  // Universal Photo -> SVG & Text Product Personalizer modal (works before OR at checkout)
  const [personalizerTarget, setPersonalizerTarget] = useState<PersonalizerTarget | null>(null);

  // Custom Request prefill state
  const [requestPrefillCategory, setRequestPrefillCategory] = useState<string | undefined>();
  const [requestPrefillNotes, setRequestPrefillNotes] = useState<string | undefined>();

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 3400);
  }, []);

  // Load all 45 staged workshop products from /products-catalog.json
  useEffect(() => {
    let active = true;
    void loadWorkshopCatalog()
      .then(({ items }) => {
        if (active && items.length > 0) {
          setCatalogItems(items);
        }
      })
      .catch(() => {
        // Fallback to default STOREFRONT_CONFIG items if catalog json is unavailable
      });
    return () => {
      active = false;
    };
  }, []);

  // Persist shopping bag locally
  useEffect(() => {
    try {
      localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(bagItems));
    } catch {
      // Ignore storage quota issues
    }
  }, [bagItems]);

  // Sync browser Back/Forward navigation between Shop and Monogram & Pattern Studio
  useEffect(() => {
    const onPopState = () => {
      setActiveView(readInitialView());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openPatternStudio = useCallback(
    (itemOrLabel?: CatalogItem | string) => {
      const label =
        typeof itemOrLabel === 'string'
          ? itemOrLabel
          : itemOrLabel?.name ?? null;
      setPatternStudioItemName(label);
      setActiveView('pattern-studio');
      try {
        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('studio', 'monogram');
        nextUrl.hash = '';
        window.history.pushState({ view: 'pattern-studio' }, '', nextUrl.toString());
      } catch {
        // Ignore history push errors in restricted contexts
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (label) {
        showToast(`Opened Monogram & Pattern Studio for ${label}`);
      }
    },
    [showToast]
  );

  const returnToShop = useCallback((sectionId?: string) => {
    setActiveView('shop');
    try {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete('studio');
      nextUrl.hash = '';
      window.history.pushState({ view: 'shop' }, '', nextUrl.toString());
    } catch {
      // Ignore history push errors
    }
    if (sectionId) {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const scrollToSection = (id: string) => {
    let targetId = id;
    if (id === 'purse-studio') {
      setAtelierTab('purse');
      targetId = 'atelier-hub';
    } else if (id === 'bespoke') {
      setAtelierTab('bespoke');
      targetId = 'atelier-hub';
    } else if (id === 'timelapse') {
      setAtelierTab('timelapse');
      targetId = 'atelier-hub';
    }
    if (activeView !== 'shop') {
      returnToShop(targetId);
      return;
    }
    window.requestAnimationFrame(() => {
      const el = document.getElementById(targetId) || document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleQuickPersonalizeById = (productIdMatch: string) => {
    const match =
      catalogItems.find((c) => c.id === productIdMatch) || catalogItems[0];
    if (!match) return;
    handleOpenProductPersonalizer(match, {
      primaryHex: match.defaultPrimaryHex,
      accentHex: match.defaultAccentHex,
      engraving: match.defaultEngraving || '',
    });
  };

  // Bag mutations
  const addItemToBag = (item: Omit<BagItem, 'qty'>) => {
    setBagItems((prev) => {
      const existing = prev.find((b) => b.key === item.key);
      if (existing) {
        return prev.map((b) => (b.key === item.key ? { ...b, qty: b.qty + 1 } : b));
      }
      return [...prev, { ...item, qty: 1 }];
    });
    showToast(`Added ${item.name} to your Boutique Bag`);
    setIsBagOpen(true);
  };

  const handleUpdateQty = (key: string, delta: number) => {
    setBagItems((prev) =>
      prev
        .map((b) => (b.key === key ? { ...b, qty: b.qty + delta } : b))
        .filter((b) => b.qty > 0)
    );
  };

  const handleRemoveBagItem = (key: string) => {
    setBagItems((prev) => prev.filter((b) => b.key !== key));
  };

  // Inline Purse Studio actions
  const handleAddPurseToBag = (cfg: PurseConfig, price: number) => {
    const shapeName =
      PURSE_SILHOUETTES.find((s) => s.id === cfg.shape)?.name || 'Custom Purse';
    const sizeName = PURSE_SIZES.find((s) => s.id === cfg.size)?.name || 'Everyday';
    const colorSummary =
      cfg.colorMode === 'solid'
        ? `Solid ${cfg.primaryHex}`
        : cfg.colorMode === 'tri-color'
          ? `Tri-Color ${cfg.primaryHex} + ${cfg.secondaryHex} + ${cfg.tertiaryHex || '#F4F7FA'}`
          : `${cfg.colorMode} ${cfg.primaryHex} + ${cfg.secondaryHex}`;
    const monoText =
      cfg.badge !== 'none' && cfg.monogram.trim()
        ? ` · Monogram "${cfg.monogram.trim().toUpperCase()}"`
        : '';

    const key = `purse_${cfg.shape}_${cfg.size}_${cfg.colorMode}_${cfg.primaryHex}_${cfg.secondaryHex}_${cfg.tertiaryHex || ''}_${cfg.monogram}_${cfg.handle}_${cfg.clasp}`;
    addItemToBag({
      key,
      name: `Custom ${shapeName}`,
      kind: 'purse',
      price,
      primaryHex: cfg.primaryHex,
      secondaryHex: cfg.colorMode === 'solid' ? cfg.primaryHex : cfg.secondaryHex,
      details: `${sizeName} · ${colorSummary} · ${cfg.finish} finish${monoText}`,
    });
  };

  const saveLocalDesign = (entry: Record<string, unknown>, label: string) => {
    try {
      const prevRaw = localStorage.getItem(SAVED_DESIGNS_KEY);
      const prev = prevRaw ? (JSON.parse(prevRaw) as unknown[]) : [];
      const next = [{ id: `local_${Date.now()}`, savedAt: new Date().toISOString(), ...entry }, ...prev].slice(0, 25);
      localStorage.setItem(SAVED_DESIGNS_KEY, JSON.stringify(next));
      showToast(`Saved "${label}" in your browser!`);
    } catch {
      showToast('Saved design to current session.');
    }
  };

  const handleSavePurseDesign = (cfg: PurseConfig, price: number) => {
    const shapeName =
      PURSE_SILHOUETTES.find((s) => s.id === cfg.shape)?.name || 'Custom Purse';
    saveLocalDesign({ kind: 'purse', name: `Custom ${shapeName}`, price, config: cfg }, `Custom ${shapeName}`);
  };

  // Catalog actions
  const handleCustomizePursePreset = (item: CatalogItem) => {
    if (item.studioUrl) {
      window.location.href = item.studioUrl;
      return;
    }
    if (item.pursePreset) {
      setPurseConfig((prev) => ({
        ...prev,
        ...item.pursePreset,
        primaryHex: item.defaultPrimaryHex,
        secondaryHex: item.defaultAccentHex,
      }));
    }
    scrollToSection('purse-studio');
    showToast(`Loaded ${item.name} into the 3D Purse Studio`);
  };

  const handleOpenAccessoryCustomizer = (
    item: CatalogItem,
    quickOverride?: { primaryHex: string; accentHex: string; engraving: string }
  ) => {
    setActiveAccessoryItem(item);
    if (item.accessoryKind) {
      setActiveAccessoryInit({
        productId: item.id,
        productName: item.name,
        accessoryKind: item.accessoryKind,
        colorMode: 'two-tone',
        primaryHex: quickOverride?.primaryHex || item.defaultPrimaryHex,
        accentHex: quickOverride?.accentHex || item.defaultAccentHex,
        finish: 'silk',
        engravingText: quickOverride?.engraving ?? item.defaultEngraving ?? 'CLT',
        engravingFont: 'editorial',
        basePrice: item.price,
      });
    } else {
      setActiveAccessoryInit(null);
    }
  };

  const handleQuickAddCatalog = (
    item: CatalogItem,
    quickOverride?: { primaryHex: string; accentHex: string; engraving: string }
  ) => {
    const primaryHex = quickOverride?.primaryHex || item.defaultPrimaryHex;
    const secondaryHex = quickOverride?.accentHex || item.defaultAccentHex;
    const engraving = quickOverride?.engraving?.trim();
    const key = `cat_${item.id}_${primaryHex}_${secondaryHex}_${engraving || 'std'}`;

    addItemToBag({
      key,
      productId: item.id,
      name: item.name,
      kind: item.isPurse ? 'purse' : 'accessory',
      price: item.price,
      primaryHex,
      secondaryHex,
      photoUrl: item.photoUrl,
      details: engraving
        ? `Two-Tone ${primaryHex} + ${secondaryHex} · Engraved "${engraving}"`
        : `${item.dimensions || item.categoryLabel || 'Custom 3D Print'} · ${primaryHex} + ${secondaryHex}`,
    });
  };

  // Open Photo -> SVG & Text Personalizer from ANY product card (before checkout)
  const handleOpenProductPersonalizer = (
    item: CatalogItem,
    quickOverride: { primaryHex: string; accentHex: string; engraving: string }
  ) => {
    setPersonalizerTarget({
      productId: item.id,
      name: item.name,
      price: item.price,
      photoUrl: item.photoUrl,
      primaryHex: quickOverride.primaryHex || item.defaultPrimaryHex,
      secondaryHex: quickOverride.accentHex || item.defaultAccentHex,
      dimensions: item.dimensions,
    });
  };

  // Open Photo -> SVG & Text Personalizer from ANY item already inside the Boutique Bag (at checkout)
  const handlePersonalizeBagItem = (bagItem: BagItem) => {
    const matchedCatalog = catalogItems.find(
      (c) => c.id === bagItem.productId || c.name === bagItem.name
    );
    setIsBagOpen(false);
    setPersonalizerTarget({
      productId: bagItem.productId || matchedCatalog?.id || bagItem.key,
      name: bagItem.name,
      price: bagItem.price,
      photoUrl: bagItem.photoUrl || matchedCatalog?.photoUrl,
      primaryHex: bagItem.primaryHex,
      secondaryHex: bagItem.secondaryHex,
      dimensions: matchedCatalog?.dimensions,
      existingBagKey: bagItem.key,
      initialPersonalization: bagItem.personalization,
    });
  };

  // Save converted SVG + custom text personalization into Boutique Bag
  const handleSavePersonalization = (
    target: PersonalizerTarget,
    personalization: ItemPersonalization,
    summaryDetails: string
  ) => {
    if (target.existingBagKey) {
      setBagItems((prev) =>
        prev.map((b) =>
          b.key === target.existingBagKey
            ? {
                ...b,
                details: summaryDetails,
                personalization,
              }
            : b
        )
      );
      setPersonalizerTarget(null);
      setIsBagOpen(true);
      showToast(`Saved print personalization on ${target.name}`);
      return;
    }

    const customKey = `pers_${target.productId}_${Date.now().toString(36)}`;
    addItemToBag({
      key: customKey,
      productId: target.productId,
      name: `${target.name} (Personalized)`,
      kind: 'catalog',
      price: target.price,
      primaryHex: target.primaryHex,
      secondaryHex: personalization.artworkColorHex || target.secondaryHex,
      photoUrl: target.photoUrl,
      details: summaryDetails,
      personalization,
    });
    setPersonalizerTarget(null);
  };

  const handleAddAccessoryToBag = (cfg: AccessoryConfig, price: number) => {
    const key = `acc_${cfg.productId}_${cfg.colorMode}_${cfg.primaryHex}_${cfg.accentHex}_${cfg.engravingText}_${cfg.engravingFont}`;
    addItemToBag({
      key,
      name: cfg.productName,
      kind: 'accessory',
      price,
      primaryHex: cfg.primaryHex,
      secondaryHex: cfg.colorMode === 'solid' ? cfg.primaryHex : cfg.accentHex,
      details: `${cfg.colorMode} · ${cfg.finish} · ${
        cfg.engravingText.trim()
          ? `Engraved "${cfg.engravingText.trim()}" (${cfg.engravingFont})`
          : 'Clean unengraved'
      }`,
    });
    setActiveAccessoryItem(null);
    setActiveAccessoryInit(null);
  };

  const handleSaveAccessoryDesign = (cfg: AccessoryConfig, price: number) => {
    saveLocalDesign({ kind: 'accessory', name: cfg.productName, price, config: cfg }, cfg.productName);
  };

  // Record boutique checkout order (localStorage + live server sync -> visible in /manage/)
  const handlePlaceOrder = async (payload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    fulfillment: 'pickup' | 'shipping';
    subtotal: number;
    shipping: number;
    total: number;
  }): Promise<string> => {
    const orderNum = `M704-${Math.floor(100000 + Math.random() * 900000)}`;
    await recordBoutiqueOrder({
      orderNumber: orderNum,
      createdAt: new Date().toISOString(),
      status: 'new',
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      fulfillment: payload.fulfillment,
      subtotal: payload.subtotal,
      shipping: payload.shipping,
      total: payload.total,
      items: bagItems.map((b) => ({ ...b })),
    });
    showToast(`Order #${orderNum} reserved!`);
    return orderNum;
  };

  // Record bespoke custom design request (localStorage + live server sync -> visible in /manage/)
  const handleSubmitBespokeLocal = async (payload: {
    referenceId: string;
    category: string;
    neededByDate: string;
    notes: string;
    engravingIdea: string;
    primaryHex: string;
    accentHex: string;
    referenceFileName: string;
    customerName: string;
    customerEmail: string;
    instagramHandle: string;
  }) => {
    await recordCustomRequest({
      referenceId: payload.referenceId,
      createdAt: new Date().toISOString(),
      status: 'new',
      category: payload.category,
      neededByDate: payload.neededByDate,
      notes: payload.notes,
      engravingIdea: payload.engravingIdea,
      primaryHex: payload.primaryHex,
      accentHex: payload.accentHex,
      referenceFileName: payload.referenceFileName,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      instagramHandle: payload.instagramHandle,
    });
  };

  const bagCount = bagItems.reduce((sum, item) => sum + item.qty, 0);
  const currentPursePrice = calculatePursePrice(purseConfig);

  return (
    <div id="top" className="relative min-h-screen text-white pb-20 md:pb-0">
      {/* Fixed Full-Bleed Photorealistic Uptown Charlotte Sunset Skyline Backdrop */}
      <div aria-hidden="true" className="charlotte-skyline-backdrop" />
      <div aria-hidden="true" className="charlotte-skyline-scrim" />

      <div className="relative z-10">
      <OfflineIndicator />

      {/* Sunset-Gold -> Rose -> Charlotte Blue Signature Hairline */}
      <div
        aria-hidden="true"
        className="h-1 w-full bg-gradient-to-r from-[#F59E0B] via-[#EC4899] via-50% to-[#0085CA]"
      />

      {/* 3-Zone Editorial Smoked-Glass Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#090D18]/72 backdrop-blur-xl border-b border-white/12 pt-safe shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              if (activeView !== 'shop') {
                e.preventDefault();
                returnToShop('top');
              }
            }}
            className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.16em] text-white whitespace-nowrap shrink-0 drop-shadow-sm"
          >
            {STOREFRONT_CONFIG.brand.name}
          </a>

          {/* Zone 2: Concise Single-Line Navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-5 lg:gap-6 text-xs font-semibold tracking-wide text-slate-200/90"
          >
            <button
              type="button"
              onClick={() => scrollToSection('collection')}
              className={`whitespace-nowrap shrink-0 transition-colors ${
                activeView === 'shop' ? 'text-white hover:text-[#FDE68A]' : 'hover:text-[#FDE68A]'
              }`}
            >
              Collection ({catalogItems.length})
            </button>
            <a
              href={STUDIO_URL}
              className="text-[#FDE68A] hover:text-white whitespace-nowrap shrink-0 transition-colors inline-flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F5B96B]" />
              <span>3D Purse Studio</span>
            </a>
            <button
              type="button"
              onClick={() => openPatternStudio()}
              aria-current={activeView === 'pattern-studio' ? 'page' : undefined}
              className={`whitespace-nowrap shrink-0 transition-all inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
                activeView === 'pattern-studio'
                  ? 'bg-[#5EEAD4]/18 border-[#5EEAD4]/60 text-[#5EEAD4] shadow-[0_0_16px_rgba(94,234,212,0.18)]'
                  : 'border-transparent text-[#5EEAD4] hover:text-white hover:bg-white/8'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Monogram &amp; Pattern Studio</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('purse-studio')}
              className="hidden xl:inline-block hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              Quick Customizer
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('bespoke')}
              className="hover:text-[#5EEAD4] whitespace-nowrap shrink-0 transition-colors"
            >
              Custom Request
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton variant="header" onToast={showToast} />

            <a
              href={STUDIO_URL}
              className="hidden sm:inline-flex min-h-[40px] px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 hover:border-[#F5B96B] text-xs font-semibold text-white items-center gap-1.5 transition-colors whitespace-nowrap backdrop-blur-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>Purse Studio</span>
            </a>

            <a
              href="/manage/index.html"
              title="Inventory, Custom Orders & Print Queue Management (Password Protected)"
              aria-label="Open Inventory Management Page"
              className="min-h-[40px] px-3.5 py-1.5 rounded-full border border-[#F5B96B]/40 bg-[#F5B96B]/12 hover:bg-[#F5B96B]/22 hover:border-[#F5B96B] text-xs font-bold text-[#FDE68A] hover:text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-[#F5B96B]" />
              <span>Inventory</span>
            </a>

            <button
              type="button"
              onClick={() => setIsBagOpen(true)}
              aria-label={`Open boutique bag with ${bagCount} items`}
              className="min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F5B96B] to-[#E59A45] hover:from-[#FDE68A] hover:to-[#F5B96B] text-[#0B101C] text-xs font-bold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shadow-md"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bag</span>
              <span className="tabular-nums">({bagCount})</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeView === 'pattern-studio' ? (
          <MonogramPatternStudioView
            selectedProductName={patternStudioItemName}
            purseStudioUrl={STUDIO_URL}
            onBackToShop={() => returnToShop()}
          />
        ) : (
        <>
        {/* ============================================================ */}
        {/* 1. IMMERSIVE CHARLOTTE SUNSET SKYLINE HERO                   */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden border-b border-white/12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-9 items-center">
              {/* Left Editorial Headline & Multi-Category CTAs */}
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#090D18]/65 backdrop-blur-md border border-[#F5B96B]/35">
                  <span className="w-2 h-2 rounded-full bg-[#F5B96B] shadow-[0_0_10px_#F5B96B]" />
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-[#FDE68A] uppercase">
                    Charlotte 3D Atelier · Custom Made to Order
                  </p>
                </div>

                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.03] tracking-tight text-balance drop-shadow-[0_6px_28px_rgba(0,0,0,0.65)]">
                  Custom 3D Prints,{' '}
                  <span className="italic sunset-text-gradient">
                    Styled Your Way.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-100/95 leading-relaxed max-w-xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)]">
                  From sculpted multi-color purses to custom herb grinders, LED lightboxes, 3D wall logos, lighter sleeves, and keychains—upload any phone photo or name and preview it live on your print before you buy.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPersonalizeById('carryall-tote')}
                    className="cta-shimmer min-h-[48px] px-6 py-3 rounded-full bg-gradient-to-r from-[#F5B96B] via-[#EFA452] to-[#E08A3C] hover:from-[#FDE68A] hover:to-[#F5B96B] text-[#0B101C] text-sm font-bold inline-flex items-center gap-2 transition-all shadow-[0_12px_32px_rgba(245,158,11,0.35)] hover:-translate-y-0.5"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>Upload Photo / Personalize Any Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('collection')}
                    className="min-h-[48px] px-5 py-3 rounded-full bg-[#0B101C]/70 hover:bg-[#0B101C]/90 backdrop-blur-md border border-white/25 hover:border-[#5EEAD4] text-white text-sm font-semibold inline-flex items-center gap-1.5 transition-all"
                  >
                    <span>Shop {catalogItems.length} Pieces</span>
                    <ArrowRight className="w-4 h-4 text-[#5EEAD4]" />
                  </button>
                </div>

                {/* Quick-Jump Multi-Category Lane Pills (No Doom Scrolling) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Purses & Bags', sub: '21 Silhouettes', cat: 'signature-41' as ProductCategory, icon: ShoppingBag, color: 'text-[#FDE68A]' },
                    { label: 'Smoke & Ritual', sub: 'Grinders & Trays', cat: 'erotic-label' as ProductCategory, icon: Flame, color: 'text-[#FB7185]' },
                    { label: 'LED & Business', sub: 'Signs & Sleeves', cat: 'custom-studio' as ProductCategory, icon: Zap, color: 'text-[#7DD3FC]' },
                    { label: 'Clutches', sub: 'Statement Shapes', cat: 'sculptural-clutches' as ProductCategory, icon: Sparkles, color: 'text-[#5EEAD4]' },
                  ].map((lane) => {
                    const Icon = lane.icon;
                    return (
                      <button
                        key={lane.label}
                        type="button"
                        onClick={() => {
                          setActiveCategory(lane.cat);
                          scrollToSection('collection');
                        }}
                        className="text-left p-3 rounded-2xl bg-[#090D18]/65 hover:bg-[#0D1426]/90 backdrop-blur-md border border-white/14 hover:border-[#F5B96B]/60 transition-all hover:-translate-y-0.5"
                      >
                        <Icon className={`w-4 h-4 ${lane.color}`} />
                        <p className="text-xs font-bold text-white mt-1.5 leading-tight">{lane.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{lane.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Visual Stage: Editorial Capsule + Frosted Glass Live 3D Purse Spotlight */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
                {/* Editorial Illustration Panel */}
                <div className="sm:col-span-7 relative rounded-3xl overflow-hidden border border-white/20 bg-[#0B101C]/60 min-h-[300px] sm:min-h-[390px] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
                  <img
                    src={STOREFRONT_CONFIG.hero.illustrationUrl}
                    alt={STOREFRONT_CONFIG.hero.illustrationAlt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#090D18]/94 via-[#090D18]/50 to-transparent text-white">
                    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#FDE68A]">
                      Queen City Custom 3D Boutique
                    </p>
                    <p className="font-serif text-lg font-semibold leading-snug">
                      Purses · Grinders · LED Signs · Custom Logos
                    </p>
                  </div>
                </div>

                {/* Live Interactive 3D Purse Spotlight */}
                <div className="sm:col-span-5 glass-card rounded-3xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.18em] text-[#FDE68A] uppercase">
                        Live 3D Preview
                      </p>
                      <p className="text-xs font-semibold text-white">
                        Spin &amp; Tap Colorways
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#7DD3FC] tabular-nums">
                      ${currentPursePrice}
                    </span>
                  </div>

                  <div className="my-2 h-[200px] sm:h-[220px] rounded-2xl bg-[#0D1322]/90 border border-white/12 overflow-hidden">
                    <Purse3DViewport
                      config={purseConfig}
                      cameraPreset="hero"
                      autoRotate
                      enableZoom={false}
                      compact
                      className="w-full h-full"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-1.5">
                      {MULTI_COLOR_PAIRINGS.slice(0, 4).map((pair) => {
                        const active =
                          purseConfig.primaryHex === pair.primaryHex &&
                          purseConfig.secondaryHex === pair.secondaryHex;
                        return (
                          <button
                            key={pair.id}
                            type="button"
                            title={pair.name}
                            aria-label={`Preview ${pair.name}`}
                            onClick={() =>
                              setPurseConfig((prev) => ({
                                ...prev,
                                colorMode: pair.mode,
                                primaryHex: pair.primaryHex,
                                secondaryHex: pair.secondaryHex,
                                tertiaryHex: pair.tertiaryHex || '#F4F7FA',
                                finish: pair.finish,
                                hardwareFinish: pair.hardwareFinish,
                              }))
                            }
                            className={`flex-1 h-8 rounded-xl border transition-transform ${
                              active
                                ? 'ring-2 ring-[#F5B96B] ring-offset-1 ring-offset-[#0D1322] border-white'
                                : 'border-white/25 hover:scale-105'
                            }`}
                            style={{
                              background: `linear-gradient(135deg, ${pair.primaryHex} 0%, ${pair.secondaryHex} 100%)`,
                            }}
                          />
                        );
                      })}
                    </div>

                    <a
                      href={STUDIO_URL}
                      className="w-full min-h-[38px] rounded-full bg-white/12 hover:bg-[#F5B96B] hover:text-[#0B101C] text-white border border-white/20 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
                      <span>Open Full 3D Purse Studio</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. AUTO-SCROLLING GALLERY OF PRODUCTS MADE IN OUR ATELIER    */}
        {/* ============================================================ */}
        <MadeInAtelierGallery
          onSelectCategory={(cat) => {
            setActiveCategory(cat);
            scrollToSection('collection');
          }}
          onQuickPersonalize={handleQuickPersonalizeById}
        />

        {/* ============================================================ */}
        {/* 3. COMPACT CURATED BOUTIQUE & WORKSHOP CATALOG (8 AT A TIME) */}
        {/* ============================================================ */}
        <BoutiqueCatalog
          catalogItems={catalogItems}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onCustomizePursePreset={handleCustomizePursePreset}
          onOpenAccessoryCustomizer={handleOpenAccessoryCustomizer}
          onQuickAddCatalog={handleQuickAddCatalog}
          onOpenPatternStudio={(item) => openPatternStudio(item)}
          onPersonalizeItem={handleOpenProductPersonalizer}
          onToast={showToast}
        />

        {/* ============================================================ */}
        {/* 4. UNIFIED INTERACTIVE CHARLOTTE ATELIER HUB (TABBED)        */}
        {/* ============================================================ */}
        <section id="atelier-hub" className="py-12 lg:py-16 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold tracking-[0.2em] text-[#5EEAD4] uppercase">
                  Interactive Charlotte Atelier
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
                  Design, Watch &amp; <span className="italic sunset-text-gradient">Request One-of-One.</span>
                </h2>
              </div>

              <div
                role="tablist"
                aria-label="Interactive atelier workspace switcher"
                className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#090D18]/80 backdrop-blur-md border border-white/15"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={atelierTab === 'purse'}
                  onClick={() => setAtelierTab('purse')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                    atelierTab === 'purse'
                      ? 'bg-gradient-to-r from-[#F5B96B] to-[#E59A45] text-[#0B101C] shadow-md'
                      : 'text-slate-200 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>3D Purse Customizer</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={atelierTab === 'bespoke'}
                  onClick={() => setAtelierTab('bespoke')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                    atelierTab === 'bespoke'
                      ? 'bg-gradient-to-r from-[#5EEAD4] to-[#38BDF8] text-[#0B101C] shadow-md'
                      : 'text-slate-200 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>Custom Request</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={atelierTab === 'timelapse'}
                  onClick={() => setAtelierTab('timelapse')}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                    atelierTab === 'timelapse'
                      ? 'bg-white text-[#0B101C] shadow-md'
                      : 'text-slate-200 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Watch It Print</span>
                </button>
              </div>
            </div>

            {atelierTab === 'purse' && (
              <div className="[&_section]:py-0 [&_section>div]:px-0">
                <PurseDesignStudio
                  config={purseConfig}
                  onChange={setPurseConfig}
                  onAddToBag={handleAddPurseToBag}
                  onSaveDesign={handleSavePurseDesign}
                  onOpenPatternStudio={(label) => openPatternStudio(label)}
                  onToast={showToast}
                  isSaving={false}
                />
              </div>
            )}

            {atelierTab === 'bespoke' && (
              <div className="[&_section]:py-0 [&_section>div]:px-0">
                <CustomRequestSection
                  prefillCategory={requestPrefillCategory}
                  prefillNotes={requestPrefillNotes}
                  onSubmitToCloud={handleSubmitBespokeLocal}
                  onToast={showToast}
                />
              </div>
            )}

            {atelierTab === 'timelapse' && (
              <div className="[&_section]:py-0 [&_section>div]:px-0">
                <TimeLapseShowcase
                  title={STOREFRONT_CONFIG.timeLapse.title}
                  description={STOREFRONT_CONFIG.timeLapse.description}
                  videoUrl={STOREFRONT_CONFIG.timeLapse.videoUrl}
                  brandName={STOREFRONT_CONFIG.brand.name}
                  onToast={showToast}
                />
              </div>
            )}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. COMPACT CHARLOTTE CRAFT & STUDIO PILLARS                  */}
        {/* ============================================================ */}
        <section className="py-12 lg:py-16 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-[#FDE68A] uppercase">
                    {STOREFRONT_CONFIG.story.kicker}
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white mt-1">
                    {STOREFRONT_CONFIG.story.headline}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRequestPrefillCategory('Outfit Color-Match / Event & Group Set');
                    setRequestPrefillNotes(
                      `I found ${STOREFRONT_CONFIG.brand.name} through the boutique and want to customize a color-matched piece...`
                    );
                    scrollToSection('bespoke');
                  }}
                  className="text-xs font-semibold text-[#FDE68A] hover:text-white inline-flex items-center gap-1.5 self-start md:self-auto"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#5EEAD4]" />
                  <span>Request a Custom Group / Brand Order</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {STOREFRONT_CONFIG.story.pillars.map((pillar, idx) => (
                  <div
                    key={pillar.title}
                    className="p-5 rounded-2xl bg-white/6 border border-white/12 space-y-1.5"
                  >
                    <span className="text-xs font-semibold text-[#F5B96B] tabular-nums">
                      0{idx + 1}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-white">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{pillar.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        </>
        )}
      </main>

      {/* Minimalist Editorial Smoked-Glass Footer */}
      {activeView === 'shop' && (
      <footer className="bg-[#070A13]/85 backdrop-blur-xl border-t border-white/12 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="font-serif text-2xl font-semibold tracking-[0.16em]">
              {STOREFRONT_CONFIG.brand.name}
            </p>
            <p className="text-xs text-slate-400">
              {STOREFRONT_CONFIG.brand.tagline} · {STOREFRONT_CONFIG.brand.city}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('collection')}
              className="hover:text-[#FDE68A]"
            >
              Collection ({catalogItems.length})
            </button>
            <a href={STUDIO_URL} className="hover:text-[#FDE68A]">
              3D Purse Studio v4.1
            </a>
            <button
              type="button"
              onClick={() => openPatternStudio()}
              className="text-[#5EEAD4] hover:text-white"
            >
              Monogram &amp; Pattern Studio
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('bespoke')}
              className="hover:text-white"
            >
              Custom Requests
            </button>
            <a
              href="/manage/index.html"
              className="text-[#FDE68A] hover:text-white inline-flex items-center gap-1.5 font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Inventory</span>
            </a>
            <PWAInstallButton variant="footer" onToast={showToast} />
          </div>
        </div>
      </footer>
      )}

      {/* Mobile Sticky Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#090D18]/88 backdrop-blur-xl border-t border-white/12 pb-safe"
      >
        <div className="grid grid-cols-5 h-14">
          <button
            type="button"
            onClick={() => returnToShop('top')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeView === 'shop' ? 'text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('collection')}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-slate-300 hover:text-white"
          >
            <Store className="w-4 h-4" />
            <span>Shop</span>
          </button>
          <a
            href={STUDIO_URL}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#FDE68A]"
          >
            <Compass className="w-4 h-4" />
            <span>Purse</span>
          </a>
          <button
            type="button"
            onClick={() => openPatternStudio()}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
              activeView === 'pattern-studio' ? 'text-[#5EEAD4]' : 'text-[#5EEAD4]/85 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pattern</span>
          </button>
          <button
            type="button"
            onClick={() => setIsBagOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#7DD3FC] relative"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Bag ({bagCount})</span>
          </button>
        </div>
      </nav>
      </div>

      {/* Slide-Over Drawers */}
      <AccessoryCustomizerDrawer
        item={activeAccessoryItem}
        initialConfig={activeAccessoryInit}
        onClose={() => {
          setActiveAccessoryItem(null);
          setActiveAccessoryInit(null);
        }}
        onAddToBag={handleAddAccessoryToBag}
        onSaveDesign={handleSaveAccessoryDesign}
        isSaving={false}
      />

      <ShoppingBagDrawer
        isOpen={isBagOpen}
        items={bagItems}
        isSignedIn={true}
        onClose={() => setIsBagOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveBagItem}
        onPersonalizeItem={handlePersonalizeBagItem}
        onClearBag={() => setBagItems([])}
        onPlaceOrder={handlePlaceOrder}
        onSignInPrompt={() => {}}
      />

      {/* Universal Customer Photo -> SVG & Custom Text Personalizer */}
      <ProductPersonalizerModal
        target={personalizerTarget}
        onClose={() => setPersonalizerTarget(null)}
        onSavePersonalization={handleSavePersonalization}
        onToast={showToast}
      />

      {/* Toast Feedback Banner */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#0B1117] text-white text-xs font-semibold shadow-xl border border-[#334155] whitespace-nowrap max-w-[90vw] truncate"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}

export default App;
