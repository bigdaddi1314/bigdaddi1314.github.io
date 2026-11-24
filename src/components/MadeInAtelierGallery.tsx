import React, { useRef, useState } from 'react';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Flame,
  Home,
  KeyRound,
  Pause,
  Play,
  ShoppingBag,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react';
import type { ProductCategory } from '../types/store';

export interface ShowcasePhotoSlot {
  id: string;
  slotCode: string;
  title: string;
  categoryLabel: string;
  targetCategory: ProductCategory;
  productIdMatch: string;
  tagline: string;
  accentFrom: string;
  accentTo: string;
  iconKind: 'purse' | 'grinder' | 'lightbox' | 'sleeve' | 'wall-logo' | 'ashtray' | 'shelf' | 'wand' | 'tray' | 'clutch';
  /**
   * Drop your real background-edited studio photo into public/images/gallery/
   * and set realPhotoUrl: '/images/gallery/your-photo.png' to replace the placeholder automatically.
   */
  realPhotoUrl?: string;
}

export const ATELIER_SHOWCASE_PHOTOS: ShowcasePhotoSlot[] = [
  {
    id: 'slot-01',
    slotCode: 'Photo Slot 01',
    title: 'Sculpted Carryall Tote',
    categoryLabel: '3D Purses & Bags',
    targetCategory: 'signature-41',
    productIdMatch: 'carryall-tote',
    tagline: 'Two-tone architectural tote with monogram plaque',
    accentFrom: '#0085CA',
    accentTo: '#009CA6',
    iconKind: 'purse',
  },
  {
    id: 'slot-02',
    slotCode: 'Photo Slot 02',
    title: 'Custom Multi-Color Herb Grinder',
    categoryLabel: 'Smoke & Ritual',
    targetCategory: 'erotic-label',
    productIdMatch: 'herb-grinder',
    tagline: 'Precision 3D teeth + embossed custom lid logo',
    accentFrom: '#EF4444',
    accentTo: '#F59E0B',
    iconKind: 'grinder',
  },
  {
    id: 'slot-03',
    slotCode: 'Photo Slot 03',
    title: 'Illuminated LED Lightbox Sign',
    categoryLabel: 'LED & Business Signs',
    targetCategory: 'custom-studio',
    productIdMatch: 'lightbox',
    tagline: 'Glowing tabletop brand sign with your logo',
    accentFrom: '#38BDF8',
    accentTo: '#818CF8',
    iconKind: 'lightbox',
  },
  {
    id: 'slot-04',
    slotCode: 'Photo Slot 04',
    title: 'ELGlock BIC Lighter Sleeve',
    categoryLabel: 'Everyday Carry',
    targetCategory: 'custom-studio',
    productIdMatch: 'elglock-bic-sleeve',
    tagline: 'Textured tactical grip sleeve in custom colors',
    accentFrom: '#F59E0B',
    accentTo: '#EC4899',
    iconKind: 'sleeve',
  },
  {
    id: 'slot-05',
    slotCode: 'Photo Slot 05',
    title: '3D Raised Wall Logo Sign',
    categoryLabel: 'Business & Studio Branding',
    targetCategory: 'custom-studio',
    productIdMatch: 'wall-logo',
    tagline: 'Dimensional salon, boutique & barbershop signage',
    accentFrom: '#5EEAD4',
    accentTo: '#0085CA',
    iconKind: 'wall-logo',
  },
  {
    id: 'slot-06',
    slotCode: 'Photo Slot 06',
    title: 'Side-Logo Ashtray Cup',
    categoryLabel: 'Smoke & Ritual',
    targetCategory: 'erotic-label',
    productIdMatch: 'erotic-label-ashtray-cup',
    tagline: 'Raised custom relief emblem · cupholder fit',
    accentFrom: '#EC4899',
    accentTo: '#A855F7',
    iconKind: 'ashtray',
  },
  {
    id: 'slot-07',
    slotCode: 'Photo Slot 07',
    title: 'Sculpted Lips Floating Shelf',
    categoryLabel: 'Statement Home Decor',
    targetCategory: 'erotic-label',
    productIdMatch: 'lips-floating-shelf',
    tagline: 'Bold wall-mounted accent piece in silk finish',
    accentFrom: '#F43F5E',
    accentTo: '#F59E0B',
    iconKind: 'shelf',
  },
  {
    id: 'slot-08',
    slotCode: 'Photo Slot 08',
    title: 'CashApp Pay Wand & Keychains',
    categoryLabel: 'Pop-Up & Everyday Carry',
    targetCategory: 'custom-studio',
    productIdMatch: 'cashapp-pay-wand',
    tagline: 'QR & tag display wands + custom bag charms',
    accentFrom: '#22C55E',
    accentTo: '#14B8A6',
    iconKind: 'wand',
  },
  {
    id: 'slot-09',
    slotCode: 'Photo Slot 09',
    title: 'Custom Engraved Rolling Tray',
    categoryLabel: 'Smoke & Ritual',
    targetCategory: 'erotic-label',
    productIdMatch: 'rolling-tray',
    tagline: 'Upload any photo or brand graphic for inlay',
    accentFrom: '#A855F7',
    accentTo: '#38BDF8',
    iconKind: 'tray',
  },
  {
    id: 'slot-10',
    slotCode: 'Photo Slot 10',
    title: 'Sculptural Heart Evening Clutch',
    categoryLabel: '3D Clutches',
    targetCategory: 'sculptural-clutches',
    productIdMatch: 'heart-clutch',
    tagline: 'Dual-silk shimmer with custom front monogram',
    accentFrom: '#F472B6',
    accentTo: '#F5B96B',
    iconKind: 'clutch',
  },
];

function PlaceholderGlyph({ kind }: { kind: ShowcasePhotoSlot['iconKind'] }) {
  switch (kind) {
    case 'purse':
      return <ShoppingBag className="w-11 h-11 text-white/90" strokeWidth={1.4} />;
    case 'clutch':
      return <Sparkles className="w-11 h-11 text-white/90" strokeWidth={1.4} />;
    case 'grinder':
    case 'ashtray':
    case 'tray':
    case 'sleeve':
      return <Flame className="w-11 h-11 text-white/90" strokeWidth={1.4} />;
    case 'lightbox':
    case 'wall-logo':
      return <Zap className="w-11 h-11 text-white/90" strokeWidth={1.4} />;
    case 'shelf':
      return <Home className="w-11 h-11 text-white/90" strokeWidth={1.4} />;
    case 'wand':
      return <KeyRound className="w-11 h-11 text-white/90" strokeWidth={1.4} />;
  }
}

interface MadeInAtelierGalleryProps {
  onSelectCategory: (cat: ProductCategory) => void;
  onQuickPersonalize: (productIdMatch: string) => void;
}

export const MadeInAtelierGallery: React.FC<MadeInAtelierGalleryProps> = ({
  onSelectCategory,
  onQuickPersonalize,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const nudgeScroll = (dir: -1 | 1) => {
    setIsPaused(true);
    if (scrollerRef.current) {
      scrollerRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  // Duplicate list for seamless infinite marquee loop
  const loopedItems = [...ATELIER_SHOWCASE_PHOTOS, ...ATELIER_SHOWCASE_PHOTOS];

  return (
    <section
      id="made-gallery"
      aria-label="Fresh off the printers showcase gallery"
      className="py-10 sm:py-14 border-b border-white/10 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/8 border border-white/15 text-[10px] font-bold uppercase tracking-[0.18em] text-[#5EEAD4]">
              <Camera className="w-3 h-3" />
              <span>Fresh Off Our Charlotte Printers · Real Photos Coming Soon</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white leading-tight">
              More Than Purses —{' '}
              <span className="italic teal-text-gradient">Look What We Print.</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-end shrink-0">
            <button
              type="button"
              onClick={() => nudgeScroll(-1)}
              aria-label="Scroll gallery left"
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              aria-label={isPaused ? 'Resume auto-scrolling gallery' : 'Pause auto-scrolling gallery'}
              className="h-9 px-3.5 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#5EEAD4]" /> : <Pause className="w-3.5 h-3.5 text-[#FDE68A]" />}
              <span>{isPaused ? 'Play' : 'Auto'}</span>
            </button>
            <button
              type="button"
              onClick={() => nudgeScroll(1)}
              aria-label="Scroll gallery right"
              className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Auto-Scrolling Seamless Marquee Strip */}
      <div
        ref={scrollerRef}
        className={`atelier-marquee-mask w-full ${isPaused ? 'overflow-x-auto' : 'overflow-hidden'}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`atelier-marquee-track flex gap-4 sm:gap-5 px-4 py-2 w-max ${
            isPaused ? 'paused' : ''
          }`}
        >
          {loopedItems.map((slot, index) => (
            <article
              key={`${slot.id}-${index}`}
              className="group relative w-[250px] sm:w-[276px] shrink-0 rounded-3xl overflow-hidden glass-card transition-all duration-300 hover:-translate-y-1.5"
            >
              {/* Placeholder Studio Photo Frame (swaps cleanly when realPhotoUrl is set) */}
              <div className="relative aspect-[4/3] overflow-hidden border-b border-white/10">
                {slot.realPhotoUrl ? (
                  <img
                    src={slot.realPhotoUrl}
                    alt={slot.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="w-full h-full relative flex flex-col items-center justify-center p-4"
                    style={{
                      background: `radial-gradient(circle at 28% 24%, ${slot.accentFrom}44 0%, #0D1322 58%, #070A13 100%)`,
                    }}
                  >
                    {/* Subtle Editorial Camera Framing Grid */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-3 rounded-2xl border border-dashed border-white/15 pointer-events-none"
                    />
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl border border-white/25 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                      style={{
                        background: `linear-gradient(135deg, ${slot.accentFrom}, ${slot.accentTo})`,
                      }}
                    >
                      <PlaceholderGlyph kind={slot.iconKind} />
                    </div>
                    <span className="mt-3 px-2.5 py-0.5 rounded-full bg-black/45 border border-white/15 text-[10px] font-semibold text-slate-300 tracking-wide">
                      {slot.slotCode} · Real Shot Soon
                    </span>
                  </div>
                )}

                {/* Category Pill */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#070A13]/82 backdrop-blur-md border border-white/15 text-[10px] font-bold uppercase tracking-wider text-[#FDE68A]">
                  {slot.categoryLabel}
                </span>
              </div>

              {/* Card Copy & Quick Actions */}
              <div className="p-4 space-y-2.5">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white leading-snug truncate">
                    {slot.title}
                  </h3>
                  <p className="text-[11.5px] text-slate-300/90 line-clamp-1 mt-0.5">
                    {slot.tagline}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onQuickPersonalize(slot.productIdMatch)}
                    className="flex-1 min-h-[34px] px-2.5 py-1 rounded-full bg-[#5EEAD4]/14 hover:bg-[#5EEAD4]/25 border border-[#5EEAD4]/40 text-[#5EEAD4] hover:text-white text-[11px] font-bold inline-flex items-center justify-center gap-1 transition-colors"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Personalize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(slot.targetCategory)}
                    className="min-h-[34px] px-3 py-1 rounded-full bg-white/8 hover:bg-white/16 border border-white/15 text-slate-200 hover:text-white text-[11px] font-semibold transition-colors"
                  >
                    Browse
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
