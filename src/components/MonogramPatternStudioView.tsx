import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  PATTERN_HANDOFF_KEY,
  type PatternHandoffPayload,
  type PrintReliefStyle,
} from '../types/store';

export const MONOGRAM_STUDIO_SRC = '/studios/mesh-graffiti-studio.html';

export interface AppliedPatternResult {
  svgData: string;
  previewDataUrl: string;
  patternMode: string;
  reliefMode: PrintReliefStyle;
  filamentColor: string;
  handoff: PatternHandoffPayload | null;
}

interface MonogramPatternStudioViewProps {
  selectedProductName?: string | null;
  handoff?: PatternHandoffPayload | null;
  purseStudioUrl: string;
  onBackToShop: () => void;
  onApplyPatternToOrder?: (result: AppliedPatternResult) => void;
  onToast?: (msg: string) => void;
}

function readSessionHandoff(): PatternHandoffPayload | null {
  try {
    const raw = sessionStorage.getItem(PATTERN_HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PatternHandoffPayload;
    if (parsed && typeof parsed.svgData === 'string' && parsed.svgData.trim()) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

function normalizeReliefMode(raw?: string): PrintReliefStyle {
  if (raw === 'deboss' || raw === 'flush' || raw === 'emboss') return raw;
  return 'emboss';
}

export const MonogramPatternStudioView: React.FC<MonogramPatternStudioViewProps> = ({
  selectedProductName,
  handoff: handoffProp,
  purseStudioUrl,
  onBackToShop,
  onApplyPatternToOrder,
  onToast,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sentHandoffSigRef = useRef<string | null>(null);
  const pendingExportRef = useRef<{
    requestId: string;
    timer: number;
  } | null>(null);

  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [handoffApplied, setHandoffApplied] = useState(false);
  const [activeHandoff, setActiveHandoff] = useState<PatternHandoffPayload | null>(
    () => handoffProp ?? readSessionHandoff()
  );

  useEffect(() => {
    if (handoffProp) {
      setActiveHandoff(handoffProp);
      sentHandoffSigRef.current = null;
      setHandoffApplied(false);
    } else {
      const stored = readSessionHandoff();
      if (stored) setActiveHandoff(stored);
    }
  }, [handoffProp]);

  const sendHandoffToIframe = useCallback(
    (payload: PatternHandoffPayload | null) => {
      if (!payload || !iframeRef.current?.contentWindow) return;
      const sig = `${payload.productId}|${payload.bagItemId || ''}|${payload.svgData.length}|${payload.filamentColor}`;
      if (sentHandoffSigRef.current === sig) return;
      sentHandoffSigRef.current = sig;
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            type: 'M704_APPLY_HANDOFF',
            payload,
          },
          window.location.origin
        );
      } catch {
        // Fallback: iframe also reads sessionStorage on startup
      }
    },
    []
  );

  const finalizeApply = useCallback(
    (
      svgData: string,
      meta: { patternMode?: string; relief?: string; color?: string }
    ) => {
      setIsApplying(false);
      if (pendingExportRef.current) {
        window.clearTimeout(pendingExportRef.current.timer);
        pendingExportRef.current = null;
      }
      if (!svgData) {
        onToast?.('Add or unhide a monogram pattern layer first before applying to your order.');
        return;
      }
      const previewDataUrl =
        'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
      const reliefMode = normalizeReliefMode(meta.relief || activeHandoff?.reliefMode);
      const filamentColor = meta.color || activeHandoff?.filamentColor || '#F5B96B';
      const patternMode = meta.patternMode || 'brick';

      if (onApplyPatternToOrder) {
        onApplyPatternToOrder({
          svgData,
          previewDataUrl,
          patternMode,
          reliefMode,
          filamentColor,
          handoff: activeHandoff,
        });
      }
    },
    [activeHandoff, onApplyPatternToOrder, onToast]
  );

  // Listen for postMessage events from the isolated Mesh Graffiti Studio iframe
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as Record<string, unknown> | null;
      if (!data || typeof data.type !== 'string') return;

      if (data.type === 'M704_STUDIO_READY') {
        setIframeLoaded(true);
        const payload = activeHandoff || readSessionHandoff();
        if (payload) {
          sendHandoffToIframe(payload);
        }
      } else if (data.type === 'M704_HANDOFF_APPLIED') {
        if (data.ok) {
          setHandoffApplied(true);
        }
      } else if (data.type === 'M704_PATTERN_SVG_RESULT') {
        const reqId = typeof data.requestId === 'string' ? data.requestId : '';
        if (pendingExportRef.current && pendingExportRef.current.requestId !== reqId) {
          return;
        }
        if (data.ok && typeof data.svg === 'string' && data.svg.trim()) {
          finalizeApply(data.svg, {
            patternMode: typeof data.patternMode === 'string' ? data.patternMode : 'brick',
            relief: typeof data.relief === 'string' ? data.relief : undefined,
            color: typeof data.color === 'string' ? data.color : undefined,
          });
        } else {
          setIsApplying(false);
          if (pendingExportRef.current) {
            window.clearTimeout(pendingExportRef.current.timer);
            pendingExportRef.current = null;
          }
          onToast?.(
            typeof data.error === 'string'
              ? data.error
              : 'Could not extract pattern SVG — add at least one visible pattern layer.'
          );
        }
      }
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (pendingExportRef.current) {
        window.clearTimeout(pendingExportRef.current.timer);
        pendingExportRef.current = null;
      }
    };
  }, [activeHandoff, finalizeApply, onToast, sendHandoffToIframe]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    const payload = activeHandoff || readSessionHandoff();
    if (payload) {
      sendHandoffToIframe(payload);
    }
  };

  const handleApplyPatternClick = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) {
      onToast?.('Studio is still loading — please wait a second and try again.');
      return;
    }

    const requestId = `pat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    setIsApplying(true);

    const timer = window.setTimeout(() => {
      // Same-origin fallback if postMessage reply timed out
      try {
        const dbg = (
          win as unknown as {
            __meshGraffitiDebug?: {
              buildPatternOnlySvgString?: () => string | null;
              getState?: () => { patternMode?: string };
            };
          }
        ).__meshGraffitiDebug;
        const svg = dbg?.buildPatternOnlySvgString?.();
        const st = dbg?.getState?.();
        if (svg) {
          finalizeApply(svg, { patternMode: st?.patternMode || 'brick' });
          return;
        }
      } catch {
        // Ignore fallback failure
      }
      setIsApplying(false);
      pendingExportRef.current = null;
      onToast?.('Could not read the pattern SVG from the studio. Try clicking again.');
    }, 1800);

    pendingExportRef.current = { requestId, timer };
    try {
      win.postMessage(
        {
          type: 'M704_EXPORT_PATTERN_SVG',
          requestId,
        },
        window.location.origin
      );
    } catch {
      // Handled by fallback timeout above
    }
  };

  const displayProductName = activeHandoff?.productName || selectedProductName;

  return (
    <section
      id="monogram-pattern-studio"
      aria-label="Monogram and Pattern Studio"
      className="min-h-[calc(100vh-68px)] flex flex-col"
    >
      {/* Boutique Header Bar matching Maison 704 Editorial Smoked-Glass Theme */}
      <div className="bg-[#090D18]/88 backdrop-blur-xl border-b border-white/12 shadow-lg">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Back to Shop + Title */}
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onBackToShop}
                className="min-h-[38px] px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#F5B96B] hover:text-[#0B101C] border border-white/20 hover:border-[#F5B96B] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Shop</span>
              </button>

              <div className="h-5 w-px bg-white/15 hidden sm:block" aria-hidden="true" />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5EEAD4]/14 border border-[#5EEAD4]/35 text-[10px] font-bold tracking-[0.14em] uppercase text-[#5EEAD4]">
                    <Layers className="w-3 h-3" />
                    <span>Surface &amp; Monogram Engine</span>
                  </span>
                  {displayProductName && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#F5B96B]/16 border border-[#F5B96B]/40 text-[10px] font-semibold text-[#FDE68A] max-w-[260px] truncate">
                      Styling: {displayProductName}
                    </span>
                  )}
                  {handoffApplied && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/18 border border-emerald-400/45 text-[10px] font-bold text-emerald-300">
                      <Check className="w-3 h-3" />
                      <span>Your Artwork Loaded in Brick / LV</span>
                    </span>
                  )}
                </div>
                <h1 className="font-serif text-lg sm:text-xl font-semibold text-white leading-tight mt-0.5">
                  Monogram &amp; Pattern Studio
                </h1>
              </div>
            </div>

            {/* Right: Apply Pattern to Order + Quick Guide + Purse Studio + Fullscreen Tab */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onApplyPatternToOrder && (
                <button
                  type="button"
                  id="applyPatternToOrderBtn"
                  disabled={!iframeLoaded || isApplying}
                  onClick={handleApplyPatternClick}
                  className="min-h-[38px] px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F5B96B] to-[#E59A45] hover:from-[#FDE68A] hover:to-[#F5B96B] disabled:opacity-55 text-[#0B101C] text-xs font-bold inline-flex items-center gap-1.5 shadow-[0_8px_24px_rgba(245,185,107,0.3)] transition-all whitespace-nowrap"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isApplying
                      ? 'Attaching Slicer SVG…'
                      : 'Apply Pattern to My Order ✓'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowGuide((prev) => !prev)}
                aria-expanded={showGuide}
                className="min-h-[36px] px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-slate-200 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#FDE68A]" />
                <span>Quick Guide</span>
                {showGuide ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              <a
                href={purseStudioUrl}
                className="min-h-[36px] px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-[#F5B96B] text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FDE68A]" />
                <span>3D Purse Studio</span>
              </a>

              <a
                href={MONOGRAM_STUDIO_SRC}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[36px] px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/14 border border-white/15 text-slate-200 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                title="Open studio in a dedicated browser tab"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span className="hidden sm:inline">Full Tab</span>
              </a>
            </div>
          </div>

          {/* Shopper Quick Instructions Strip */}
          {showGuide && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/6 border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#F5B96B]/20 border border-[#F5B96B]/45 text-[#FDE68A] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-200/95 leading-snug">
                  <strong className="text-white inline-flex items-center gap-1">
                    <Upload className="w-3 h-3 text-[#FDE68A]" /> Upload Your Logo
                  </strong>{' '}
                  (SVG, PNG, JPG) or refine the artwork sent straight from your product preview.
                </p>
              </div>

              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/6 border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#5EEAD4]/20 border border-[#5EEAD4]/45 text-[#5EEAD4] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-200/95 leading-snug">
                  <strong className="text-white">Pick Pattern &amp; 3D Relief:</strong> Switch between Brick / LV Half-Drop, Grid, Radial, Spiral, or Scatter — and preview Emboss, Deboss, Flush, or Fuzzy Skin.
                </p>
              </div>

              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/6 border border-white/10">
                <span className="w-5 h-5 rounded-full bg-[#7DD3FC]/20 border border-[#7DD3FC]/45 text-[#7DD3FC] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-200/95 leading-snug">
                  <strong className="text-white">Attach to Order or Export:</strong> Click{' '}
                  <strong className="text-[#FDE68A]">Apply Pattern to My Order ✓</strong> to attach the slicer-ready Pattern-Only SVG straight to your bag.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Height Isolated Studio Iframe Container */}
      <div className="flex-1 w-full max-w-[1680px] mx-auto px-0 sm:px-4 lg:px-6 py-0 sm:py-4 flex flex-col">
        <div className="relative flex-1 w-full min-h-[720px] h-[calc(100vh-190px)] sm:rounded-2xl overflow-hidden border-y sm:border border-white/15 bg-[#111411] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
          {!iframeLoaded && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#111411] text-slate-300 text-xs">
              <div className="w-8 h-8 rounded-full border-2 border-[#F5B96B]/30 border-t-[#F5B96B] animate-spin" />
              <span>Loading Monogram &amp; Pattern Studio…</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            id="monogramStudioFrame"
            src={MONOGRAM_STUDIO_SRC}
            title="Monogram & Pattern Studio — Mesh Graffiti 3D Surface Engine"
            onLoad={handleIframeLoad}
            allow="fullscreen"
            allowFullScreen
            className="w-full h-full min-h-[720px] border-0 block bg-[#111411]"
          />
        </div>
      </div>
    </section>
  );
};
