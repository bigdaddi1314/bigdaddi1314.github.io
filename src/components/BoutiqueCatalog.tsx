import React, { useMemo, useState } from 'react';
import {
  Camera,
  Layers,
  Palette,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Type,
  Wand2,
} from 'lucide-react';
import { CATALOG_ITEMS, PURSE_SILHOUETTES } from '../config/storefrontConfig';
import { buildPurseStudioUrl } from '../services/catalogLoader';
import type { CatalogItem, ProductCategory } from '../types/store';
import { AccessoryPreviewSVG } from './AccessoryPreviewSVG';

interface BoutiqueCatalogProps {
  catalogItems?: CatalogItem[];
  activeCategory: ProductCategory;
  onCategoryChange: (cat: ProductCategory) => void;
  onCustomizePursePreset: (item: CatalogItem) => void;
  onOpenAccessoryCustomizer: (
    item: CatalogItem,
    quickOverride?: { primaryHex: string; accentHex: string; engraving: string }
  ) => void;
  onQuickAddCatalog: (
    item: CatalogItem,
    quickOverride?: { primaryHex: string; accentHex: string; engraving: string }
  ) => void;
  onOpenPatternStudio?: (item?: CatalogItem) => void;
  onPersonalizeItem?: (
    item: CatalogItem,
    quickOverride: { primaryHex: string; accentHex: string; engraving: string }
  ) => void;
  onToast: (msg: string) => void;
}

const QUEEN_CITY_THEMES = [
  { id: 'blue-teal', label: 'Blue & Teal', primary: '#0085CA', accent: '#009CA6' },
  { id: 'obsidian-blue', label: 'Obsidian & Blue', primary: '#141920', accent: '#0085CA' },
  { id: 'white-grey', label: 'Ice White & Grey', primary: '#F4F7FA', accent: '#475569' },
  { id: 'teal-black', label: 'Teal & Black', primary: '#009CA6', accent: '#141920' },
  { id: 'silver-teal', label: 'Silver & Teal', primary: '#B8C4D0', accent: '#009CA6' },
];

const FALLBACK_CATEGORY_LABEL: Record<string, string> = {
  purses: 'Sculpted Purse',
  charms: 'Keychain & Charm',
  lifestyle: 'Smoke & Lifestyle',
  'signature-41': 'Signature 4.1',
  'bags-crossbodies': 'Bags & Crossbodies',
  'sculptural-clutches': 'Sculptural Clutch',
  'erotic-label': 'Erotic Label',
  'custom-studio': 'Custom Studio',
};

export const BoutiqueCatalog: React.FC<BoutiqueCatalogProps> = ({
  catalogItems = CATALOG_ITEMS,
  activeCategory,
  onCategoryChange,
  onQuickAddCatalog,
  onOpenPatternStudio,
  onPersonalizeItem,
  onToast,
}) => {
  const [localPhotos, setLocalPhotos] = useState<Record<string, string>>({});
  const [quickOverrides, setQuickOverrides] = useState<
    Record<string, { primaryHex: string; accentHex: string; engraving: string }>
  >({});
  const [livePreviewText, setLivePreviewText] = useState<string>('');
  const [activeThemeId, setActiveThemeId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(8);
  const [showPreviewBar, setShowPreviewBar] = useState<boolean>(false);

  const hasWorkshopCategories = useMemo(
    () => catalogItems.some((item) => Boolean(item.workshopCategory)),
    [catalogItems]
  );

  const filterTabs = useMemo<Array<{ id: ProductCategory; label: string }>>(() => {
    if (hasWorkshopCategories) {
      const countOf = (id: string) =>
        catalogItems.filter((i) => i.workshopCategory === id).length;
      return [
        { id: 'all', label: `All Pieces (${catalogItems.length})` },
        { id: 'signature-41', label: `Signature 4.1 (${countOf('signature-41')})` },
        { id: 'bags-crossbodies', label: `Bags & Crossbodies (${countOf('bags-crossbodies')})` },
        { id: 'sculptural-clutches', label: `Sculptural Clutches (${countOf('sculptural-clutches')})` },
        { id: 'erotic-label', label: `Erotic Label (${countOf('erotic-label')})` },
        { id: 'custom-studio', label: `Custom Studio (${countOf('custom-studio')})` },
      ];
    }
    return [
      { id: 'all', label: `All Pieces (${catalogItems.length})` },
      { id: 'purses', label: 'Sculpted Purses' },
      { id: 'charms', label: 'Keychains & Bag Charms' },
      { id: 'lifestyle', label: 'Grinders, Trays & Sleeves' },
    ];
  }, [catalogItems, hasWorkshopCategories]);

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalogItems.filter((item) => {
      if (activeCategory !== 'all') {
        const matchesWorkshop = item.workshopCategory === activeCategory;
        const matchesMaison = item.category === activeCategory;
        if (!matchesWorkshop && !matchesMaison) return false;
      }
      if (!q) return true;
      const hay = [
        item.name,
        item.subtitle,
        item.categoryLabel,
        item.badge,
        item.sku,
        item.dimensions,
        item.inventoryRef,
        item.studioPreset,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [activeCategory, catalogItems, searchQuery]);

  const displayedItems = useMemo(
    () => visibleItems.slice(0, visibleLimit),
    [visibleItems, visibleLimit]
  );

  const handleSelectCategory = (cat: ProductCategory) => {
    setVisibleLimit(8);
    onCategoryChange(cat);
  };

  const getOverride = (item: CatalogItem) =>
    quickOverrides[item.id] ?? {
      primaryHex: item.defaultPrimaryHex,
      accentHex: item.defaultAccentHex,
      engraving: item.defaultEngraving || '',
    };

  const updateOverride = (
    item: CatalogItem,
    patch: Partial<{ primaryHex: string; accentHex: string; engraving: string }>
  ) => {
    setQuickOverrides((prev) => ({
      ...prev,
      [item.id]: {
        ...getOverride(item),
        ...patch,
      },
    }));
  };

  const applyShowcaseTheme = (theme: (typeof QUEEN_CITY_THEMES)[number]) => {
    setActiveThemeId(theme.id);
    setQuickOverrides((prev) => {
      const next = { ...prev };
      for (const item of catalogItems) {
        const current = prev[item.id] ?? {
          primaryHex: item.defaultPrimaryHex,
          accentHex: item.defaultAccentHex,
          engraving: item.defaultEngraving || '',
        };
        next[item.id] = {
          ...current,
          primaryHex: theme.primary,
          accentHex: theme.accent,
        };
      }
      return next;
    });
    onToast(`Applied "${theme.label}" theme to Customize links & showcase`);
  };

  const handleGlobalEngravingChange = (val: string) => {
    setLivePreviewText(val);
    setQuickOverrides((prev) => {
      const next = { ...prev };
      for (const item of catalogItems) {
        const current = prev[item.id] ?? {
          primaryHex: item.defaultPrimaryHex,
          accentHex: item.defaultAccentHex,
          engraving: item.defaultEngraving || '',
        };
        const maxLen = item.isPurse ? 4 : item.maxEngravingChars || 12;
        next[item.id] = {
          ...current,
          engraving: val.trim()
            ? val.toUpperCase().slice(0, maxLen)
            : item.defaultEngraving || '',
        };
      }
      return next;
    });
  };

  const resetShowcasePreview = () => {
    setLivePreviewText('');
    setActiveThemeId('');
    setQuickOverrides({});
  };

  const handlePhotoUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLocalPhotos((prev) => {
      if (prev[itemId]) URL.revokeObjectURL(prev[itemId]);
      return { ...prev, [itemId]: url };
    });
    onToast('Loaded local product photo preview');
  };

  const clearPhoto = (itemId: string) => {
    setLocalPhotos((prev) => {
      if (prev[itemId]) URL.revokeObjectURL(prev[itemId]);
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  return (
    <section id="collection" className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header & Category Filter Strip */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#FDE68A] uppercase">
                Curated Collection · {catalogItems.length} Custom 3D-Printed Pieces
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight text-balance drop-shadow-sm">
                Purses, Lifestyle &amp;{' '}
                <span className="italic sunset-text-gradient">Custom Statements.</span>
              </h2>
              <p className="text-sm text-slate-200/90">
                Filter by category to jump straight to purses, smoke &amp; ritual gear, LED signs, keychains, or decor—and tap <strong className="text-[#5EEAD4]">Add Photo / Logo / Text</strong> on any piece to preview your own image on the print.
              </p>
            </div>

            <div className="self-start lg:self-end flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowPreviewBar((v) => !v)}
                className={`min-h-[42px] px-4 py-2 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-all backdrop-blur-md ${
                  showPreviewBar
                    ? 'bg-[#F5B96B]/20 border-[#F5B96B] text-[#FDE68A]'
                    : 'bg-[#0B101C]/75 border-white/18 text-slate-200 hover:border-[#F5B96B] hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-[#5EEAD4]" />
                <span>{showPreviewBar ? 'Hide Quick Preview' : 'Live Name & Color Preview'}</span>
              </button>
              {onOpenPatternStudio && (
                <button
                  type="button"
                  onClick={() => onOpenPatternStudio()}
                  className="min-h-[42px] px-4 py-2 rounded-full bg-[#0B101C]/75 hover:bg-[#5EEAD4]/18 border border-[#5EEAD4]/45 hover:border-[#5EEAD4] text-[#5EEAD4] hover:text-white text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap transition-all backdrop-blur-md"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Monogram &amp; Pattern Studio</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Filter collection by category"
              className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
            >
              {filterTabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelectCategory(tab.id)}
                    className={`min-h-[40px] px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all backdrop-blur-md ${
                      isActive
                        ? 'bg-gradient-to-r from-[#F5B96B] to-[#E59A45] text-[#0B101C] font-bold shadow-md'
                        : 'bg-[#0B101C]/65 border border-white/18 text-slate-200 hover:border-[#F5B96B] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Instant Search */}
            <div className="relative w-full lg:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setVisibleLimit(8);
                  setSearchQuery(e.target.value);
                }}
                placeholder="Search Grinder, Lightbox, Clutch..."
                aria-label="Search product gallery"
                className="w-full min-h-[40px] pl-10 pr-3.5 py-2 rounded-full bg-[#0B101C]/70 backdrop-blur-md border border-white/18 focus:border-[#F5B96B] focus:outline-none text-xs text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Collapsible Live Showcase Engraving & Queen City Color Theme Preview Bar */}
        {showPreviewBar && (
        <div className="glass-panel rounded-3xl p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-5 space-y-1.5">
              <label
                htmlFor="showcaseGlobalEngraving"
                className="flex items-center gap-1.5 text-xs font-semibold text-white"
              >
                <Type className="w-3.5 h-3.5 text-[#FDE68A]" />
                <span>Preview Your Name or Initials Across Every Piece</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="showcaseGlobalEngraving"
                  type="text"
                  maxLength={14}
                  value={livePreviewText}
                  onChange={(e) => handleGlobalEngravingChange(e.target.value)}
                  placeholder="Type any name or initials (e.g. JORDAN, CLT, 704)"
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-white/8 border border-white/16 focus:bg-white/12 focus:border-[#F5B96B] focus:outline-none text-sm text-white placeholder:text-slate-400"
                />
                {(livePreviewText || activeThemeId) && (
                  <button
                    type="button"
                    onClick={resetShowcasePreview}
                    title="Reset showcase previews"
                    className="min-h-[44px] px-3 rounded-xl bg-white/12 hover:bg-white/20 text-xs font-semibold text-white inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <Palette className="w-3.5 h-3.5 text-[#5EEAD4]" />
                <span>Try a Charlotte Color Theme (Preloads into 3D Purse Studio)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {QUEEN_CITY_THEMES.map((theme) => {
                  const selected = activeThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => applyShowcaseTheme(theme)}
                      className={`min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
                        selected
                          ? 'bg-[#F5B96B] text-[#0B101C] border-[#F5B96B] font-bold'
                          : 'bg-white/8 text-slate-100 border-white/16 hover:border-[#F5B96B]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/80 shadow-xs shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary} 50%, ${theme.accent} 50%)`,
                        }}
                      />
                      <span>{theme.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Result summary */}
        <div className="flex items-center justify-between text-xs text-slate-200">
          <span>
            Showing <strong className="text-[#FDE68A]">{displayedItems.length}</strong> of{' '}
            <strong className="text-white">{visibleItems.length}</strong> pieces
          </span>
          {(activeCategory !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('all');
                setSearchQuery('');
              }}
              className="font-semibold text-[#FDE68A] hover:text-white"
            >
              Show All Pieces
            </button>
          )}
        </div>

        {/* Product Grid */}
        {visibleItems.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center space-y-3">
            <h3 className="font-serif text-2xl font-semibold text-white">
              No matching pieces found
            </h3>
            <p className="text-sm text-slate-300">
              Try clearing your search or switching back to All Pieces.
            </p>
            <button
              type="button"
              onClick={() => {
                handleSelectCategory('all');
                setSearchQuery('');
              }}
              className="min-h-[42px] px-5 py-2 rounded-full bg-[#F5B96B] text-[#0B101C] text-xs font-bold"
            >
              Reset Gallery Filters
            </button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedItems.map((item) => {
              const ov = getOverride(item);
              const activePhoto = localPhotos[item.id] || item.photoUrl;
              const silhouette = item.pursePreset?.shape
                ? PURSE_SILHOUETTES.find((s) => s.id === item.pursePreset?.shape)
                : null;
              const purseDisplayMonogram =
                ov.engraving?.trim() || item.pursePreset?.monogram || 'M704';
              const categoryText =
                item.categoryLabel || FALLBACK_CATEGORY_LABEL[item.category] || 'Studio Print';
              const studioHref = buildPurseStudioUrl({
                name: item.name,
                studioPreset: item.studioPreset || 'carryall',
                primaryHex: ov.primaryHex,
                accentHex: ov.accentHex,
                size: item.isPurse ? 'medium' : undefined,
              });

              return (
                <article
                  key={item.id}
                  className="group glass-card rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5"
                >
                  <div>
                    {/* Square Studio Visual Stage */}
                    <div className="relative aspect-square bg-[#0D111A] overflow-hidden flex items-center justify-center border-b border-white/10">
                      {activePhoto ? (
                        <img
                          src={activePhoto}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : item.isPurse ? (
                        <div className="w-full h-full bg-gradient-to-b from-[#161D2E] to-[#0B101C] flex flex-col items-center justify-center p-5 relative">
                          <div
                            className="w-36 h-36 rounded-3xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, ${ov.primaryHex} 0%, ${ov.accentHex} 100%)`,
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="w-20 h-20 text-white/95 drop-shadow-sm"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.4"
                            >
                              <path
                                d={
                                  silhouette?.iconPath ||
                                  'M5 8 H19 L20 19 H4 Z M9 8 V6 A3 3 0 0 1 15 6 V8'
                                }
                              />
                            </svg>
                          </div>
                          <div className="mt-4 text-center">
                            <span className="font-serif italic text-base font-semibold tracking-wider text-white">
                              {purseDisplayMonogram.slice(0, 4)}
                            </span>
                          </div>
                        </div>
                      ) : item.accessoryKind ? (
                        <div className="w-full h-full bg-gradient-to-b from-[#161D2E] to-[#0B101C] flex items-center justify-center p-3">
                          <AccessoryPreviewSVG
                            kind={item.accessoryKind}
                            primaryHex={ov.primaryHex}
                            accentHex={ov.accentHex}
                            colorMode="two-tone"
                            finish="silk"
                            engravingText={ov.engraving}
                            engravingFont="editorial"
                          />
                        </div>
                      ) : null}

                      {/* Top-Left Category & Highlight Badge */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full bg-[#090D18]/78 backdrop-blur-md border border-white/18 text-[10px] font-semibold uppercase tracking-wider text-slate-100">
                          {categoryText}
                        </span>
                        {item.badge && (
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#F5B96B]/95 to-[#E59A45]/95 text-[10px] font-bold uppercase tracking-wider text-[#0B101C]">
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {/* Discreet Owner Local Photo Preview Trigger */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        {localPhotos[item.id] && (
                          <button
                            type="button"
                            onClick={() => clearPhoto(item.id)}
                            title="Reset to studio preview"
                            aria-label={`Reset photo for ${item.name}`}
                            className="w-8 h-8 rounded-full bg-[#090D18]/85 border border-white/25 text-white flex items-center justify-center hover:border-[#F5B96B]"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <label
                          title="Preview your own product photo"
                          className="h-8 px-2.5 rounded-full bg-[#090D18]/85 border border-white/25 text-[11px] font-semibold text-white hover:border-[#F5B96B] cursor-pointer inline-flex items-center gap-1 shadow-sm"
                        >
                          <Camera className="w-3 h-3 text-[#FDE68A]" />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(item.id, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-300">
                        <span className="truncate text-[#FDE68A]/90">
                          #{item.slot} · {item.dimensions || categoryText}
                        </span>
                        <span className="font-bold text-sm text-white tabular-nums shrink-0">
                          ${item.price}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-serif text-xl font-semibold text-white leading-snug">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-300/90 mt-1 leading-relaxed line-clamp-3">
                          {item.subtitle}
                        </p>
                      </div>

                      {/* Quick Color Theme Switcher */}
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-slate-400">
                          Color Theme
                        </span>
                        <div className="flex items-center gap-1.5">
                          {QUEEN_CITY_THEMES.slice(0, 4).map((pair) => {
                            const selected =
                              ov.primaryHex === pair.primary && ov.accentHex === pair.accent;
                            return (
                              <button
                                key={pair.id}
                                type="button"
                                title={pair.label}
                                aria-label={`Select ${pair.label} for ${item.name}`}
                                onClick={() =>
                                  updateOverride(item, {
                                    primaryHex: pair.primary,
                                    accentHex: pair.accent,
                                  })
                                }
                                className={`w-5 h-5 rounded-full border transition-transform ${
                                  selected
                                    ? 'ring-2 ring-[#F5B96B] ring-offset-1 ring-offset-[#0D1322] scale-110 border-white'
                                    : 'border-white/30 hover:scale-105'
                                }`}
                                style={{
                                  background: `linear-gradient(135deg, ${pair.primary} 50%, ${pair.accent} 50%)`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-5 pb-5 pt-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={studioHref}
                        className="flex-1 min-h-[42px] px-3 py-2 rounded-full bg-gradient-to-r from-[#F5B96B] to-[#E59A45] hover:from-[#FDE68A] hover:to-[#F5B96B] text-[#0B101C] text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all shadow-sm"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Customize</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onQuickAddCatalog(item, ov)}
                        className="min-h-[42px] px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#7DD3FC]" />
                        <span>Add</span>
                      </button>
                    </div>
                    {onPersonalizeItem && (
                      <button
                        type="button"
                        onClick={() => onPersonalizeItem(item, ov)}
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-full bg-[#5EEAD4]/14 hover:bg-[#5EEAD4]/24 border border-[#5EEAD4]/45 hover:border-[#5EEAD4] text-[#5EEAD4] hover:text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Add Photo / Logo / Text</span>
                      </button>
                    )}
                    {onOpenPatternStudio && (
                      <button
                        type="button"
                        onClick={() => onOpenPatternStudio(item)}
                        className="w-full min-h-[32px] px-3 py-1 rounded-full bg-white/5 hover:bg-white/12 border border-white/12 hover:border-white/25 text-slate-300 hover:text-white text-[10.5px] font-semibold inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                      >
                        <Layers className="w-3 h-3 text-[#FDE68A]" />
                        <span>Pro SVG Pattern Studio</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Anti-Doom-Scroll Pagination Bar */}
          {visibleItems.length > displayedItems.length ? (
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleLimit((n) => n + 8)}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F5B96B] to-[#E59A45] hover:from-[#FDE68A] hover:to-[#F5B96B] text-[#0B101C] text-xs font-bold shadow-lg transition-all"
              >
                Load 8 More Pieces ({visibleItems.length - displayedItems.length} remaining)
              </button>
              <button
                type="button"
                onClick={() => setVisibleLimit(visibleItems.length)}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/18 border border-white/20 text-white text-xs font-semibold transition-colors"
              >
                View All {visibleItems.length}
              </button>
            </div>
          ) : visibleItems.length > 8 ? (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setVisibleLimit(8);
                  document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="min-h-[38px] px-4 py-1.5 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
              >
                Collapse Back to Top 8
              </button>
            </div>
          ) : null}
          </>
        )}
      </div>
    </section>
  );
};
