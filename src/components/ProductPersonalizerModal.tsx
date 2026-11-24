import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  Eye,
  ImagePlus,
  Layers,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Trash2,
  Type,
  Wand2,
  X,
} from 'lucide-react';
import type {
  ItemPersonalization,
  PrintReliefStyle,
} from '../types/store';
import {
  prepareNativeSvg,
  vectorizeImageToSvg,
  type VectorizeMode,
  type VectorizeResult,
} from '../utils/imageToSvg';

export interface PersonalizerTarget {
  productId: string;
  name: string;
  price: number;
  photoUrl?: string;
  primaryHex: string;
  secondaryHex: string;
  dimensions?: string;
  existingBagKey?: string;
  initialPersonalization?: ItemPersonalization;
}

interface ProductPersonalizerModalProps {
  target: PersonalizerTarget | null;
  onClose: () => void;
  onSavePersonalization: (
    target: PersonalizerTarget,
    personalization: ItemPersonalization,
    summaryDetails: string
  ) => void;
  onToast: (msg: string) => void;
}

const FILAMENT_SWATCHES = [
  { name: 'Sunset Gold', hex: '#F5B96B' },
  { name: 'Ice White', hex: '#F8FAFC' },
  { name: 'Charlotte Blue', hex: '#0085CA' },
  { name: 'Hornets Teal', hex: '#00B8B8' },
  { name: 'Rose Pink', hex: '#F472B6' },
  { name: 'Mint Neon', hex: '#B8F36B' },
  { name: 'Lavender', hex: '#C4B5FD' },
  { name: 'Obsidian Black', hex: '#141920' },
];

const QUICK_ICONS: Array<{ id: string; label: string; svg: string }> = [
  {
    id: 'crown',
    label: 'Crown',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 18h18v2H3v-2zm0-2l2-9 5 4 2-6 2 6 5-4 2 9H3z"/></svg>',
  },
  {
    id: 'heart',
    label: 'Heart',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  },
  {
    id: 'star',
    label: 'Star',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2L14.8 9.2 22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2z"/></svg>',
  },
  {
    id: 'bolt',
    label: 'Bolt',
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-2 8 11-12h-7l2-8z"/></svg>',
  },
];

const FONT_FAMILIES: Record<ItemPersonalization['textFont'], { label: string; css: string; style?: string }> = {
  editorial: { label: 'Editorial', css: 'Georgia, "Times New Roman", serif' },
  modern: { label: 'Modern Bold', css: 'Inter, system-ui, sans-serif' },
  script: { label: 'Italic Luxe', css: 'Georgia, serif', style: 'italic' },
  mono: { label: 'Monospace', css: 'ui-monospace, Consolas, monospace' },
};

export const ProductPersonalizerModal: React.FC<ProductPersonalizerModalProps> = ({
  target,
  onClose,
  onSavePersonalization,
  onToast,
}) => {
  const filterUid = useId().replace(/:/g, '');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Source uploaded image state
  const [sourceImageDataUrl, setSourceImageDataUrl] = useState<string | null>(null);
  const [sourceSvgText, setSourceSvgText] = useState<string | null>(null);
  const [sourceFileName, setSourceFileName] = useState<string>('');

  // Vectorization settings
  const [vectorMode, setVectorMode] = useState<VectorizeMode>('logo');
  const [threshold, setThreshold] = useState<number | undefined>(undefined);
  const [smoothness, setSmoothness] = useState<number>(3);
  const [removeBackground, setRemoveBackground] = useState<boolean>(true);
  const [invert, setInvert] = useState<boolean>(false);
  const [isVectorizing, setIsVectorizing] = useState<boolean>(false);
  const [vectorResult, setVectorResult] = useState<VectorizeResult | null>(null);
  const [previewTab, setPreviewTab] = useState<'product' | 'compare'>('product');

  // Text & 3D print appearance settings
  const [customText, setCustomText] = useState<string>('');
  const [textFont, setTextFont] = useState<ItemPersonalization['textFont']>('editorial');
  const [textSize, setTextSize] = useState<number>(28);
  const [textYOffset, setTextYOffset] = useState<number>(30);
  const [reliefStyle, setReliefStyle] = useState<PrintReliefStyle>('emboss');
  const [artworkColorHex, setArtworkColorHex] = useState<string>('#F5B96B');
  const [secondaryColorHex, setSecondaryColorHex] = useState<string>('#7DD3FC');
  const [scalePct, setScalePct] = useState<number>(52);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [offsetXPct, setOffsetXPct] = useState<number>(0);
  const [offsetYPct, setOffsetYPct] = useState<number>(0);

  // Dragging artwork on the product preview
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Hydrate state whenever target changes
  useEffect(() => {
    if (!target) return;
    const init = target.initialPersonalization;
    setSourceImageDataUrl(null);
    setSourceSvgText(init?.customSvg || null);
    setSourceFileName(init?.sourceFileName || '');
    setVectorMode(init?.vectorMode || 'logo');
    setThreshold(undefined);
    setSmoothness(3);
    setRemoveBackground(true);
    setInvert(false);
    setPreviewTab('product');
    setCustomText(init?.customText || '');
    setTextFont(init?.textFont || 'editorial');
    setTextSize(init?.textSize ?? 28);
    setTextYOffset(init?.textYOffset ?? 30);
    setReliefStyle(init?.reliefStyle || 'emboss');
    setArtworkColorHex(init?.artworkColorHex || '#F5B96B');
    setSecondaryColorHex(init?.secondaryColorHex || '#7DD3FC');
    setScalePct(init?.scalePct ?? 52);
    setRotationDeg(init?.rotationDeg ?? 0);
    setOffsetXPct(init?.offsetXPct ?? 0);
    setOffsetYPct(init?.offsetYPct ?? 0);
    if (init?.customSvg) {
      const parsed = prepareNativeSvg(init.customSvg, init.artworkColorHex || '#F5B96B');
      setVectorResult(parsed);
    } else {
      setVectorResult(null);
    }
  }, [target]);

  // Re-run client-side Image -> SVG vectorization whenever image or tuning controls change
  useEffect(() => {
    let cancelled = false;
    if (sourceSvgText) {
      const res = prepareNativeSvg(sourceSvgText, artworkColorHex, 60);
      setVectorResult(res);
      setIsVectorizing(false);
      return;
    }
    if (!sourceImageDataUrl) {
      setVectorResult(null);
      setIsVectorizing(false);
      return;
    }

    setIsVectorizing(true);
    const timer = window.setTimeout(() => {
      void vectorizeImageToSvg(sourceImageDataUrl, {
        mode: vectorMode,
        threshold,
        smoothness,
        removeBackground,
        invert,
        fillColor: artworkColorHex,
        secondaryColor: secondaryColorHex,
        physicalWidthMm: 60,
      })
        .then((res) => {
          if (cancelled) return;
          setVectorResult(res);
          if (threshold === undefined) {
            setThreshold(res.autoThreshold);
          }
          setIsVectorizing(false);
        })
        .catch(() => {
          if (!cancelled) {
            setIsVectorizing(false);
            onToast('Could not convert that image — please try a PNG, JPG, or SVG.');
          }
        });
    }, 45);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    sourceImageDataUrl,
    sourceSvgText,
    vectorMode,
    threshold,
    smoothness,
    removeBackground,
    invert,
    artworkColorHex,
    secondaryColorHex,
    onToast,
  ]);

  const handleFileSelected = useCallback(
    (file?: File) => {
      if (!file) return;
      if (file.size > 12 * 1024 * 1024) {
        onToast('Please choose an image under 12 MB.');
        return;
      }
      setSourceFileName(file.name);
      setThreshold(undefined);
      const isSvg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';

      if (isSvg) {
        const reader = new FileReader();
        reader.onload = () => {
          const text = typeof reader.result === 'string' ? reader.result : '';
          setSourceImageDataUrl(null);
          setSourceSvgText(text);
          onToast(`Loaded SVG vector: ${file.name}`);
        };
        reader.readAsText(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        setSourceSvgText(null);
        setSourceImageDataUrl(dataUrl);
        onToast(`Converted "${file.name}" into 3D-printable SVG preview!`);
      };
      reader.readAsDataURL(file);
    },
    [onToast]
  );

  const handleQuickIcon = (icon: (typeof QUICK_ICONS)[number]) => {
    setSourceImageDataUrl(null);
    setSourceSvgText(icon.svg);
    setSourceFileName(`${icon.label} Icon.svg`);
    onToast(`Applied ${icon.label} vector icon`);
  };

  const clearUploadedImage = () => {
    setSourceImageDataUrl(null);
    setSourceSvgText(null);
    setSourceFileName('');
    setVectorResult(null);
    setThreshold(undefined);
    setPreviewTab('product');
  };

  // Build combined slicer-ready SVG containing the converted graphic AND/OR custom text
  const combinedExportSvg = useMemo(() => {
    const hasGraphic = Boolean(vectorResult && vectorResult.innerMarkup);
    const trimmedText = customText.trim();
    if (!hasGraphic && !trimmedText) return null;

    const fontMeta = FONT_FAMILIES[textFont];
    const parts: string[] = [];

    if (hasGraphic && vectorResult) {
      const vb = vectorResult.viewBox;
      const sc = 120 / Math.max(vb.w, vb.h, 1);
      const cx = vb.x + vb.w * 0.5;
      const cy = vb.y + vb.h * 0.5;
      const artY = trimmedText ? -18 : 0;
      parts.push(
        `<g transform="translate(100 ${(100 + artY).toFixed(1)}) rotate(${rotationDeg}) scale(${sc.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})">${vectorResult.innerMarkup}</g>`
      );
    }

    if (trimmedText) {
      const ty = hasGraphic ? 100 + Math.round(textYOffset * 1.4) : 100;
      const escaped = trimmedText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      parts.push(
        `<text x="100" y="${ty}" text-anchor="middle" dominant-baseline="central" fill="${artworkColorHex}" font-family='${fontMeta.css}' font-weight="700"${fontMeta.style ? ` font-style="${fontMeta.style}"` : ''} font-size="${textSize}" letter-spacing="1.6">${escaped}</text>`
      );
    }

    const svgStr =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 200 200" width="60.0mm" height="60.0mm">` +
      parts.join('') +
      `</svg>`;
    return svgStr;
  }, [vectorResult, customText, textFont, textSize, textYOffset, rotationDeg, artworkColorHex]);

  const handleDownloadSvg = () => {
    if (!combinedExportSvg) {
      onToast('Upload an image or type custom text first.');
      return;
    }
    const blob = new Blob([combinedExportSvg], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(target?.productId || 'maison704')}-custom-print.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    onToast('Downloaded 3D-print-ready SVG!');
  };

  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (previewTab !== 'product') return;
    if (!vectorResult && !customText.trim()) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: offsetXPct,
      origY: offsetYPct,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dxPct = ((e.clientX - dragRef.current.startX) / Math.max(rect.width, 1)) * 100;
    const dyPct = ((e.clientY - dragRef.current.startY) / Math.max(rect.height, 1)) * 100;
    setOffsetXPct(Math.max(-35, Math.min(35, Math.round(dragRef.current.origX + dxPct))));
    setOffsetYPct(Math.max(-35, Math.min(35, Math.round(dragRef.current.origY + dyPct))));
  };

  const handleStagePointerUp = () => {
    dragRef.current = null;
  };

  const handleSave = () => {
    if (!target) return;
    const trimmed = customText.trim();
    if (!trimmed && !vectorResult) {
      onToast('Upload a photo/logo or add custom text to personalize this piece.');
      return;
    }

    const previewDataUrl = combinedExportSvg
      ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(combinedExportSvg)
      : undefined;

    const reliefLabel =
      reliefStyle === 'emboss'
        ? 'Raised Emboss (+0.8mm)'
        : reliefStyle === 'deboss'
          ? 'Engraved Deboss (-0.6mm)'
          : 'Flush Color Inlay';

    const summaryParts = [
      sourceFileName ? `Custom Image → SVG (${sourceFileName})` : '',
      trimmed ? `Text "${trimmed}"` : '',
      `${reliefLabel} · ${artworkColorHex}`,
    ].filter(Boolean);

    const personalization: ItemPersonalization = {
      customText: trimmed,
      textFont,
      textSize,
      textYOffset,
      reliefStyle,
      artworkColorHex,
      secondaryColorHex: vectorMode === 'photo' ? secondaryColorHex : undefined,
      sourceFileName: sourceFileName || undefined,
      vectorMode: sourceImageDataUrl ? vectorMode : undefined,
      scalePct,
      rotationDeg,
      offsetXPct,
      offsetYPct,
      customSvg: combinedExportSvg || undefined,
      previewDataUrl,
    };

    onSavePersonalization(target, personalization, summaryParts.join(' · '));
  };

  if (!target) return null;

  const activeFilterAttr =
    reliefStyle === 'emboss'
      ? `url(#emboss_${filterUid})`
      : reliefStyle === 'deboss'
        ? `url(#deboss_${filterUid})`
        : undefined;

  const hasArtwork = Boolean(vectorResult || customText.trim());
  const fontMeta = FONT_FAMILIES[textFont];

  return (
    <div
      id="productPersonalizerModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalizerTitle"
      className="fixed inset-0 z-50 bg-[#050811]/82 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl max-h-[95vh] bg-[#0B101D] border border-white/15 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#090D18] border-b border-white/12 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5EEAD4]/15 border border-[#5EEAD4]/35 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5EEAD4]">
                <Wand2 className="w-3 h-3" />
                <span>Photo → 3D Print SVG Preview</span>
              </span>
              {target.existingBagKey && (
                <span className="px-2 py-0.5 rounded-full bg-[#F5B96B]/18 border border-[#F5B96B]/40 text-[10px] font-semibold text-[#FDE68A]">
                  Editing Bag Item
                </span>
              )}
            </div>
            <h2
              id="personalizerTitle"
              className="font-serif text-xl sm:text-2xl font-semibold text-white truncate mt-0.5"
            >
              Personalize {target.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close personalizer"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Live Interactive "On Your Print" Preview */}
          <div className="lg:col-span-6 p-4 sm:p-6 bg-gradient-to-b from-[#101729] to-[#080C17] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex rounded-full bg-[#070A13] border border-white/12 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab('product')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    previewTab === 'product'
                      ? 'bg-[#F5B96B] text-[#0B101C]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  On Your Print
                </button>
                <button
                  type="button"
                  disabled={!sourceImageDataUrl}
                  onClick={() => setPreviewTab('compare')}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                    previewTab === 'compare'
                      ? 'bg-[#5EEAD4] text-[#0B101C]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Photo vs. Print Vector
                </button>
              </div>

              {combinedExportSvg && (
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="px-3 py-1.5 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-[11px] font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                  title="Download converted print-ready SVG"
                >
                  <Download className="w-3 h-3 text-[#7DD3FC]" />
                  <span>SVG</span>
                </button>
              )}
            </div>

            {previewTab === 'compare' && sourceImageDataUrl ? (
              <div className="grid grid-cols-2 gap-3 min-h-[320px] sm:min-h-[380px]">
                <div className="rounded-2xl bg-[#070A13] border border-white/12 p-3 flex flex-col items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Your Uploaded Photo
                  </span>
                  <img
                    src={sourceImageDataUrl}
                    alt="Uploaded source"
                    className="max-h-[280px] max-w-full object-contain rounded-xl"
                  />
                </div>
                <div className="rounded-2xl bg-[#070A13] border border-[#5EEAD4]/35 p-3 flex flex-col items-center justify-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#5EEAD4]">
                    3D-Print Vector SVG
                  </span>
                  {vectorResult ? (
                    <svg
                      viewBox={`${vectorResult.viewBox.x} ${vectorResult.viewBox.y} ${vectorResult.viewBox.w} ${vectorResult.viewBox.h}`}
                      className="max-h-[280px] w-full"
                      dangerouslySetInnerHTML={{ __html: vectorResult.innerMarkup }}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Converting…</span>
                  )}
                </div>
              </div>
            ) : (
              <div
                ref={stageRef}
                onPointerDown={handleStagePointerDown}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerUp}
                onPointerCancel={handleStagePointerUp}
                className={`relative aspect-square w-full max-w-[440px] mx-auto rounded-3xl overflow-hidden border border-white/15 bg-[#090D18] select-none touch-none ${
                  hasArtwork ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
              >
                {/* Product Base Photo or Color-Matched Studio Stage */}
                {target.photoUrl ? (
                  <img
                    src={target.photoUrl}
                    alt={target.name}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${target.primaryHex}, ${target.secondaryHex} 75%, #090D18 100%)`,
                    }}
                  >
                    <div className="w-56 h-56 rounded-3xl border border-white/25 bg-white/10 shadow-2xl" />
                  </div>
                )}

                {/* Subtle Studio Vignette so embossed/debossed artwork reads realistically */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 48%, rgba(5,8,17,0.06) 28%, rgba(5,8,17,0.46) 100%)',
                  }}
                />

                {/* Live Vectorized SVG + Custom Text Projected Onto the Print */}
                <svg
                  id="personalizerPreviewSvg"
                  viewBox="0 0 300 300"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <defs>
                    <filter id={`emboss_${filterUid}`} x="-25%" y="-25%" width="150%" height="150%">
                      <feDropShadow dx="1.8" dy="2.6" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.72" />
                      <feDropShadow dx="-1" dy="-1" stdDeviation="0.6" floodColor="#ffffff" floodOpacity="0.42" />
                    </filter>
                    <filter id={`deboss_${filterUid}`} x="-25%" y="-25%" width="150%" height="150%">
                      <feDropShadow dx="-1.4" dy="-1.8" stdDeviation="1.2" floodColor="#000000" floodOpacity="0.82" />
                      <feDropShadow dx="1" dy="1.3" stdDeviation="0.7" floodColor="#ffffff" floodOpacity="0.32" />
                    </filter>
                  </defs>

                  {hasArtwork && (
                    <g
                      filter={activeFilterAttr}
                      opacity={reliefStyle === 'deboss' ? 0.84 : 0.96}
                      transform={`translate(${(150 + offsetXPct * 2.6).toFixed(1)} ${(150 + offsetYPct * 2.6).toFixed(1)}) rotate(${rotationDeg})`}
                    >
                      {vectorResult && (
                        <g
                          transform={`translate(0 ${customText.trim() ? -16 : 0}) scale(${(
                            ((scalePct / 100) * 190) /
                            Math.max(vectorResult.viewBox.w, vectorResult.viewBox.h, 1)
                          ).toFixed(4)}) translate(${-(
                            vectorResult.viewBox.x +
                            vectorResult.viewBox.w * 0.5
                          ).toFixed(2)} ${-(
                            vectorResult.viewBox.y +
                            vectorResult.viewBox.h * 0.5
                          ).toFixed(2)})`}
                          dangerouslySetInnerHTML={{ __html: vectorResult.innerMarkup }}
                        />
                      )}

                      {customText.trim() && (
                        <text
                          x="0"
                          y={vectorResult ? Math.round((scalePct * 0.85) + textYOffset * 0.8) : 0}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={artworkColorHex}
                          fontFamily={fontMeta.css}
                          fontStyle={fontMeta.style || 'normal'}
                          fontWeight="700"
                          fontSize={textSize}
                          letterSpacing="1.6"
                          stroke={reliefStyle === 'deboss' ? '#090D18' : 'rgba(255,255,255,0.22)'}
                          strokeWidth={reliefStyle === 'flush' ? 0 : 0.6}
                        >
                          {customText.trim()}
                        </text>
                      )}
                    </g>
                  )}
                </svg>

                {/* Status Badge on Stage */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-full bg-[#070A13]/82 border border-white/15 text-[10px] font-semibold text-slate-200">
                    {isVectorizing
                      ? 'Converting image to 3D vector…'
                      : hasArtwork
                        ? 'Drag directly on preview to position'
                        : 'Upload any photo or type text →'}
                  </span>
                  {vectorResult && (
                    <span className="px-2.5 py-1 rounded-full bg-[#070A13]/85 border border-[#5EEAD4]/40 text-[10px] font-bold text-[#5EEAD4]">
                      ✓ Print-Ready SVG ({vectorResult.pathCount} shape{vectorResult.pathCount === 1 ? '' : 's'})
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              <Eye className="w-3.5 h-3.5 inline mr-1 text-[#FDE68A]" />
              What you see above is your exact converted 3D vector relief preview. Our Charlotte atelier prints this exact vector directly onto your {target.name}.
            </p>
          </div>

          {/* RIGHT: Everyday Shopper Controls */}
          <div className="lg:col-span-6 p-4 sm:p-6 space-y-5">
            {/* 1. Image Upload & Auto-Vectorization */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#FDE68A] inline-flex items-center gap-1.5">
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>1. Upload Any Photo, Logo, or Screenshot</span>
                </h3>
                {(sourceImageDataUrl || sourceSvgText) && (
                  <button
                    type="button"
                    onClick={clearUploadedImage}
                    className="text-[11px] font-semibold text-rose-300 hover:text-white inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Image</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                id="personalizerFileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  handleFileSelected(f);
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  handleFileSelected(f);
                }}
                className="w-full p-4 rounded-2xl border border-dashed border-[#5EEAD4]/45 bg-[#5EEAD4]/6 hover:bg-[#5EEAD4]/12 hover:border-[#5EEAD4] text-left flex items-center gap-3.5 transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[#5EEAD4]/15 border border-[#5EEAD4]/35 text-[#5EEAD4] flex items-center justify-center shrink-0">
                  <ImagePlus className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">
                    {sourceFileName || 'Tap to upload a JPG, PNG, phone photo, or SVG'}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    No SVG needed — we automatically trace your image into a clean 3D-printable vector.
                  </p>
                </div>
              </button>

              {/* Quick Starter Icons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Or try an icon:</span>
                {QUICK_ICONS.map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => handleQuickIcon(ic)}
                    className="px-2.5 py-1 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-[11px] font-semibold text-slate-200 transition-colors"
                  >
                    ✦ {ic.label}
                  </button>
                ))}
              </div>

              {/* Photo-to-SVG Tuning Controls (Shown automatically when a raster photo/PNG/JPG is uploaded) */}
              {sourceImageDataUrl && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/12 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#5EEAD4]">
                      Auto-Convert Style (Photo → Print Vector)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setThreshold(undefined);
                        setSmoothness(3);
                        setInvert(false);
                        setRemoveBackground(true);
                      }}
                      className="text-[10px] font-semibold text-slate-300 hover:text-white inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Auto</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'logo', label: 'Logo / Graphic', hint: 'Crisp cutout' },
                        { id: 'photo', label: 'Photo Relief', hint: '2-tone depth' },
                        { id: 'stamp', label: 'Line Stamp', hint: 'Engraved look' },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setVectorMode(m.id)}
                        className={`p-2 rounded-xl border text-center transition-colors ${
                          vectorMode === m.id
                            ? 'bg-[#5EEAD4]/18 border-[#5EEAD4] text-white'
                            : 'bg-[#070A13]/60 border-white/12 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{m.label}</div>
                        <div className="text-[9.5px] text-slate-400">{m.hint}</div>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Detail / Contrast</span>
                        <span className="text-[#FDE68A] tabular-nums">{threshold ?? vectorResult?.autoThreshold ?? 128}</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={230}
                        value={threshold ?? vectorResult?.autoThreshold ?? 128}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="w-full accent-[#5EEAD4]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Edge Smoothness</span>
                        <span className="text-[#FDE68A] tabular-nums">{smoothness}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={8}
                        value={smoothness}
                        onChange={(e) => setSmoothness(Number(e.target.value))}
                        className="w-full accent-[#5EEAD4]"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRemoveBackground((v) => !v)}
                      className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                        removeBackground
                          ? 'bg-[#5EEAD4]/18 border-[#5EEAD4] text-[#5EEAD4]'
                          : 'bg-white/5 border-white/15 text-slate-300'
                      }`}
                    >
                      {removeBackground ? '✓ Background Removed' : 'Keep Background'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvert((v) => !v)}
                      className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                        invert
                          ? 'bg-[#F5B96B]/20 border-[#F5B96B] text-[#FDE68A]'
                          : 'bg-white/5 border-white/15 text-slate-300'
                      }`}
                    >
                      {invert ? '✓ Inverted Light/Dark' : 'Invert Light / Dark'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Custom Text / Monogram */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#FDE68A] inline-flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>2. Add Custom Name, Initials, or Phrase (Optional)</span>
              </h3>
              <input
                id="personalizerTextInput"
                type="text"
                maxLength={22}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. MAYA, CLT 704, QUEEN CITY"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#070A13] border border-white/18 focus:border-[#F5B96B] focus:outline-none text-sm text-white placeholder:text-slate-500"
              />
              {customText.trim() && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(FONT_FAMILIES) as Array<ItemPersonalization['textFont']>).map(
                      (fk) => (
                        <button
                          key={fk}
                          type="button"
                          onClick={() => setTextFont(fk)}
                          className={`px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
                            textFont === fk
                              ? 'bg-[#F5B96B] text-[#0B101C] border-[#F5B96B]'
                              : 'bg-white/6 border-white/15 text-slate-200 hover:border-white/35'
                          }`}
                        >
                          {FONT_FAMILIES[fk].label}
                        </button>
                      )
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-300">Text Size</span>
                        <span className="text-[#FDE68A] tabular-nums">{textSize} pt</span>
                      </div>
                      <input
                        type="range"
                        min={14}
                        max={52}
                        value={textSize}
                        onChange={(e) => setTextSize(Number(e.target.value))}
                        className="w-full accent-[#F5B96B]"
                      />
                    </label>
                    {vectorResult && (
                      <label className="block space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300">Text Spacing</span>
                          <span className="text-[#FDE68A] tabular-nums">{textYOffset}</span>
                        </div>
                        <input
                          type="range"
                          min={-20}
                          max={60}
                          value={textYOffset}
                          onChange={(e) => setTextYOffset(Number(e.target.value))}
                          className="w-full accent-[#F5B96B]"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Print Style, Size & Filament Color */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[#FDE68A] inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>3. 3D Print Style, Size &amp; Filament Color</span>
              </h3>

              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'emboss', label: 'Raised Emboss', sub: '+0.8mm 3D pop' },
                    { id: 'deboss', label: 'Engraved Deboss', sub: '-0.6mm carved' },
                    { id: 'flush', label: 'Flush Inlay', sub: 'Smooth flat' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReliefStyle(r.id)}
                    className={`p-2 rounded-xl border text-center transition-colors ${
                      reliefStyle === r.id
                        ? 'bg-[#F5B96B]/20 border-[#F5B96B] text-white'
                        : 'bg-white/5 border-white/12 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{r.label}</div>
                    <div className="text-[9.5px] text-slate-400">{r.sub}</div>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {FILAMENT_SWATCHES.map((sw) => (
                  <button
                    key={sw.hex}
                    type="button"
                    title={sw.name}
                    aria-label={sw.name}
                    onClick={() => setArtworkColorHex(sw.hex)}
                    className={`w-7 h-7 rounded-full border transition-transform ${
                      artworkColorHex.toLowerCase() === sw.hex.toLowerCase()
                        ? 'ring-2 ring-[#F5B96B] ring-offset-2 ring-offset-[#0B101D] scale-110 border-white'
                        : 'border-white/30 hover:scale-105'
                    }`}
                    style={{ backgroundColor: sw.hex }}
                  />
                ))}
                <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/8 border border-white/15 text-[11px] cursor-pointer">
                  <span>Custom</span>
                  <input
                    type="color"
                    value={artworkColorHex}
                    onChange={(e) => setArtworkColorHex(e.target.value)}
                    className="w-5 h-5 rounded-full border-0 bg-transparent cursor-pointer"
                  />
                </label>
              </div>

              {hasArtwork && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Logo Scale</span>
                      <span className="text-[#FDE68A] tabular-nums">{scalePct}%</span>
                    </div>
                    <input
                      type="range"
                      min={18}
                      max={90}
                      value={scalePct}
                      onChange={(e) => setScalePct(Number(e.target.value))}
                      className="w-full accent-[#F5B96B]"
                    />
                  </label>
                  <label className="block space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Rotate</span>
                      <span className="text-[#FDE68A] tabular-nums">{rotationDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={rotationDeg}
                      onChange={(e) => setRotationDeg(Number(e.target.value))}
                      className="w-full accent-[#F5B96B]"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer CTA */}
        <div className="px-5 sm:px-6 py-4 bg-[#090D18] border-t border-white/12 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white">{target.name}</span> ·{' '}
            <span className="font-bold text-[#FDE68A]">${target.price}</span>
            {vectorResult && (
              <span className="ml-2 text-[#5EEAD4] font-semibold">
                <Check className="w-3.5 h-3.5 inline" /> Slicer SVG Attached
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[42px] px-4 py-2 rounded-full bg-white/8 hover:bg-white/15 border border-white/15 text-xs font-semibold text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              id="savePersonalizationBtn"
              onClick={handleSave}
              className="min-h-[44px] px-6 py-2 rounded-full bg-gradient-to-r from-[#F5B96B] to-[#E59A45] hover:from-[#FDE68A] hover:to-[#F5B96B] text-[#0B101C] text-xs font-bold inline-flex items-center gap-2 shadow-lg transition-all"
            >
              {target.existingBagKey ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Personalization to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Personalized Item to Bag</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
