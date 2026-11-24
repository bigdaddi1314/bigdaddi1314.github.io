import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Layers,
  RotateCw,
  ShoppingBag,
  Shuffle,
} from 'lucide-react';
import {
  FINISH_OPTIONS,
  HARDWARE_OPTIONS,
  MULTI_COLOR_PAIRINGS,
  PURSE_BADGES,
  PURSE_CLASPS,
  PURSE_HANDLES,
  PURSE_SILHOUETTES,
  PURSE_SIZES,
  PURSE_TEXTURES,
  calculatePursePrice,
} from '../config/storefrontConfig';
import { exportPurseToSTL, getResolvedDimensions } from '../three/purseGeometry';
import type { ColorMode, PurseConfig } from '../types/store';
import { Purse3DViewport, type CameraPreset } from './Purse3DViewport';
import { SpectrumColorPicker } from './SpectrumColorPicker';

interface PurseDesignStudioProps {
  config: PurseConfig;
  onChange: (next: PurseConfig) => void;
  onAddToBag: (cfg: PurseConfig, price: number) => void;
  onSaveDesign: (cfg: PurseConfig, price: number, sharePublicly?: boolean) => void;
  onOpenPatternStudio?: (contextLabel?: string) => void;
  onToast: (msg: string) => void;
  isSaving?: boolean;
}

const STEP_META = [
  {
    step: 1,
    short: '1. Shape',
    nextLabel: 'Next: Pick Colors',
    title: 'Choose Your Silhouette & Size',
    guide:
      'Step 1 of 4 — Pick the bag shape and size that fits your day. Everyday comfortably fits an iPhone Pro Max, wallet, and keys.',
  },
  {
    step: 2,
    short: '2. Colors',
    nextLabel: 'Next: Handles & Monogram',
    title: 'Full-Spectrum & Multi-Color Studio',
    guide:
      'Step 2 of 4 — Choose Solid, Two-Tone, Ombre, Dual-Silk, or Tri-Color (up to 3 shades). Tap any color slot below to dial in any shade across the full spectrum.',
  },
  {
    step: 3,
    short: '3. Details',
    nextLabel: 'Next: Review Bag',
    title: 'Handles, Clasp & 3D Monogram',
    guide:
      'Step 3 of 4 — Select how you want to carry it, pick your closure, and preview up to 4 personal initials live on the front plaque.',
  },
  {
    step: 4,
    short: '4. Review',
    nextLabel: 'Ready to Add',
    title: 'Review Your Custom Creation',
    guide:
      'Step 4 of 4 — Spin the 3D preview one last time, add an optional outfit or gift note, then save to your account or add straight to your bag.',
  },
];

const COLOR_MODES: Array<{ id: ColorMode; label: string; hint: string; slots: number }> = [
  { id: 'solid', label: 'Solid', hint: '1 shade', slots: 1 },
  { id: 'two-tone', label: 'Two-Tone', hint: 'Body + Lid', slots: 2 },
  { id: 'ombre', label: 'Ombre', hint: '2-shade fade', slots: 2 },
  { id: 'dual-silk', label: 'Dual-Silk', hint: '2-tone shift', slots: 2 },
  { id: 'tri-color', label: 'Tri-Color', hint: '3 custom shades', slots: 3 },
];

export const PurseDesignStudio: React.FC<PurseDesignStudioProps> = ({
  config,
  onChange,
  onAddToBag,
  onSaveDesign,
  onOpenPatternStudio,
  onToast,
  isSaving = false,
}) => {
  const [step, setStep] = useState<number>(1);
  const [activeColorSlot, setActiveColorSlot] = useState<1 | 2 | 3>(1);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [presetNonce, setPresetNonce] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [ownerOpen, setOwnerOpen] = useState<boolean>(false);
  const [sharePublicly, setSharePublicly] = useState<boolean>(false);

  const tertiaryHex = config.tertiaryHex || '#F4F7FA';
  const price = useMemo(() => calculatePursePrice(config), [config]);
  const dims = useMemo(() => getResolvedDimensions(config), [config]);

  const shapeSpec = useMemo(
    () => PURSE_SILHOUETTES.find((s) => s.id === config.shape) ?? PURSE_SILHOUETTES[0],
    [config.shape]
  );
  const sizeSpec = useMemo(
    () => PURSE_SIZES.find((s) => s.id === config.size) ?? PURSE_SIZES[1],
    [config.size]
  );
  const textureSpec = useMemo(
    () => PURSE_TEXTURES.find((t) => t.id === config.texture) ?? PURSE_TEXTURES[0],
    [config.texture]
  );
  const finishSpec = useMemo(
    () => FINISH_OPTIONS.find((f) => f.id === config.finish) ?? FINISH_OPTIONS[0],
    [config.finish]
  );

  const currentMeta = STEP_META[step - 1];

  const update = (patch: Partial<PurseConfig>) => {
    onChange({ ...config, ...patch });
  };

  const handleModeChange = (mode: ColorMode) => {
    update({ colorMode: mode });
    if (mode === 'solid') setActiveColorSlot(1);
    else if (mode !== 'tri-color' && activeColorSlot === 3) setActiveColorSlot(2);
  };

  const handleSwapColors = () => {
    if (config.colorMode === 'tri-color') {
      update({
        primaryHex: config.secondaryHex,
        secondaryHex: tertiaryHex,
        tertiaryHex: config.primaryHex,
      });
    } else if (config.colorMode !== 'solid') {
      update({
        primaryHex: config.secondaryHex,
        secondaryHex: config.primaryHex,
      });
    }
  };

  const triggerCamera = (preset: CameraPreset) => {
    setCameraPreset(preset);
    setPresetNonce((n) => n + 1);
    if (preset === 'peek' && config.lidAngle < 50) {
      update({ lidAngle: 68 });
    }
  };

  const applySurprisePalette = () => {
    const pick =
      MULTI_COLOR_PAIRINGS[Math.floor(Math.random() * MULTI_COLOR_PAIRINGS.length)];
    update({
      colorMode: pick.mode,
      primaryHex: pick.primaryHex,
      secondaryHex: pick.secondaryHex,
      tertiaryHex: pick.tertiaryHex || '#F4F7FA',
      finish: pick.finish,
      hardwareFinish: pick.hardwareFinish,
    });
    onToast(`Applied "${pick.name}" color palette`);
  };

  const handleExportStl = (part: 'full' | 'body' | 'lid') => {
    try {
      const filename = exportPurseToSTL(config, part);
      onToast(`Downloaded print-ready ${filename}`);
    } catch {
      onToast('Could not generate STL export in this browser');
    }
  };

  return (
    <section id="purse-studio" className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/30 overflow-hidden shadow-2xl text-[#0B1117]">
          {/* Studio Top Header */}
          <div className="px-6 sm:px-10 py-7 border-b border-[#DCE4EC] flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold tracking-[0.18em] text-[#009CA6] uppercase">
                Maison 704 Interactive 3D Atelier
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#0B1117]">
                Design Your Custom Purse
              </h2>
              <p className="text-sm text-[#475569] max-w-2xl">
                Follow 4 simple guided steps to pick your silhouette, blend full-spectrum multi-color finishes, and preview your personal monogram live in 360°.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
              {onOpenPatternStudio && (
                <button
                  type="button"
                  onClick={() => onOpenPatternStudio(`Custom ${shapeSpec.name}`)}
                  className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#0B1117] hover:bg-[#1E293B] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-[#5EEAD4]" />
                  <span>Add Custom Logo / Pattern</span>
                </button>
              )}
              <button
                type="button"
                onClick={applySurprisePalette}
                className="min-h-[44px] px-4 py-2.5 rounded-full bg-[#EEF3F7] hover:bg-[#DCE4EC] text-[#0B1117] text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#0085CA]" />
                <span>Inspire Me</span>
              </button>
            </div>
          </div>

          {/* Main Split Workspace: Left 3D Stage + Right Guided Step Wizard */}
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* LEFT: 3D STAGE */}
            <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[480px] lg:min-h-[680px] bg-gradient-to-b from-[#F8FAFC] via-[#EEF3F7] to-[#E2EAF2] border-b lg:border-b-0 lg:border-r border-[#DCE4EC]">
              <Purse3DViewport
                config={config}
                cameraPreset={cameraPreset}
                presetNonce={presetNonce}
                autoRotate={autoRotate}
              />

              {/* Top-Left Clean Spec Readout (solid white, zero backdrop-filter over WebGL) */}
              <div className="pointer-events-none absolute top-4 left-4 z-10 bg-white/95 border border-[#DCE4EC] rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3">
                <div className="flex items-center -space-x-1.5">
                  <span
                    className="w-5 h-5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: config.primaryHex }}
                  />
                  {config.colorMode !== 'solid' && (
                    <span
                      className="w-5 h-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: config.secondaryHex }}
                    />
                  )}
                  {config.colorMode === 'tri-color' && (
                    <span
                      className="w-5 h-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: tertiaryHex }}
                    />
                  )}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-[#0B1117]">{shapeSpec.name}</div>
                  <div className="text-[11px] text-[#475569]">
                    {sizeSpec.name} · {finishSpec.name}
                  </div>
                </div>
              </div>

              {/* Unified Bottom Camera Dock (Zero Viewport Occlusion, solid surface over WebGL) */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-white/95 border border-[#DCE4EC] px-2 py-1.5 rounded-full shadow-md max-w-[94%] overflow-x-auto">
                {(
                  [
                    { id: 'front', label: 'Front' },
                    { id: 'side', label: 'Side' },
                    { id: 'top', label: 'Top' },
                    { id: 'peek', label: 'Inside' },
                  ] as Array<{ id: CameraPreset; label: string }>
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => triggerCamera(cam.id)}
                    className="min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold text-[#475569] hover:text-[#0B1117] hover:bg-[#EEF3F7] transition-colors whitespace-nowrap"
                  >
                    {cam.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAutoRotate((r) => !r)}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    autoRotate
                      ? 'bg-[#0085CA] text-white'
                      : 'text-[#475569] hover:bg-[#EEF3F7]'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>360°</span>
                </button>
              </div>
            </div>

            {/* RIGHT: SIMPLIFIED GUIDED 4-STEP PANEL */}
            <div className="lg:col-span-5 flex flex-col bg-white">
              {/* Progress Bar + Interactive Step Tabs */}
              <div className="p-3 bg-[#F8FAFC] border-b border-[#DCE4EC] space-y-2.5">
                <div className="grid grid-cols-4 gap-1.5">
                  {STEP_META.map((item) => {
                    const isActive = step === item.step;
                    const isDone = step > item.step;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => setStep(item.step)}
                        className={`min-h-[40px] px-2 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1 ${
                          isActive
                            ? 'bg-[#0B1117] text-white shadow-sm'
                            : isDone
                              ? 'bg-[#E6F4FA] text-[#0085CA] hover:bg-[#D5ECF7]'
                              : 'bg-white text-[#475569] border border-[#DCE4EC] hover:text-[#0B1117]'
                        }`}
                      >
                        {isDone && <Check className="w-3 h-3 shrink-0" />}
                        <span className="truncate">{item.short}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="w-full h-1 rounded-full bg-[#DCE4EC] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0085CA] to-[#009CA6] transition-all duration-200"
                    style={{ width: `${(step / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Guided Prompt Header */}
              <div className="px-6 pt-5 pb-3 border-b border-[#EEF3F7]">
                <h3 className="font-serif text-2xl font-semibold text-[#0B1117]">
                  {currentMeta.title}
                </h3>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  {currentMeta.guide}
                </p>
              </div>

              {/* Scrollable Step Body */}
              <div className="p-5 sm:p-6 flex-1 overflow-y-auto max-h-[460px] lg:max-h-[440px] space-y-6">
                {/* STEP 1: SILHOUETTE, SIZE & TEXTURE */}
                {step === 1 && (
                  <>
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        1A. Pick Your Bag Silhouette
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {PURSE_SILHOUETTES.map((s) => {
                          const active = config.shape === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => update({ shape: s.id })}
                              className={`min-h-[56px] p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA] shadow-xs'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                  active
                                    ? 'bg-[#0085CA] text-white'
                                    : 'bg-[#EEF3F7] text-[#0B1117]'
                                }`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                >
                                  <path d={s.iconPath} />
                                </svg>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-[#0B1117] truncate">
                                  {s.name}
                                </div>
                                <div className="text-[11px] text-[#475569] truncate">
                                  {s.vibe}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        1B. Choose Your Size
                      </div>
                      <div className="space-y-2">
                        {PURSE_SIZES.map((sz) => {
                          const active = config.size === sz.id;
                          return (
                            <button
                              key={sz.id}
                              type="button"
                              onClick={() => update({ size: sz.id })}
                              className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA]'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1117]">
                                  <span>{sz.name}</span>
                                  {sz.popular && (
                                    <span className="text-[#009CA6] font-semibold">
                                      · Most Popular
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#475569] mt-0.5">
                                  {sz.guidance}
                                </div>
                              </div>
                              <span className="text-xs font-semibold text-[#0B1117] tabular-nums shrink-0">
                                {sz.priceDelta === 0
                                  ? 'Included'
                                  : sz.priceDelta > 0
                                    ? `+$${sz.priceDelta}`
                                    : `-$${Math.abs(sz.priceDelta)}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        1C. Sculpted Surface Texture
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PURSE_TEXTURES.map((tx) => {
                          const active = config.texture === tx.id;
                          return (
                            <button
                              key={tx.id}
                              type="button"
                              onClick={() => update({ texture: tx.id })}
                              className={`min-h-[52px] p-3 rounded-2xl border text-left transition-all ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA]'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div className="text-xs font-semibold text-[#0B1117]">
                                {tx.name}
                              </div>
                              <div className="text-[11px] text-[#475569] mt-0.5">
                                {tx.vibe}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2: FULL-SPECTRUM & MULTI-COLOR STUDIO */}
                {step === 2 && (
                  <>
                    {/* Quick Curated Charlotte Color Stories */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0B1117]">
                          2A. Charlotte Starter Palettes
                        </span>
                        <span className="text-[11px] text-[#475569]">One-tap themes</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {MULTI_COLOR_PAIRINGS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              update({
                                colorMode: p.mode,
                                primaryHex: p.primaryHex,
                                secondaryHex: p.secondaryHex,
                                tertiaryHex: p.tertiaryHex || '#F4F7FA',
                                finish: p.finish,
                                hardwareFinish: p.hardwareFinish,
                              })
                            }
                            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3F7] border border-[#DCE4EC] text-[11px] font-semibold text-[#0B1117] inline-flex items-center gap-1.5 transition-colors"
                          >
                            <span className="flex -space-x-1">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white"
                                style={{ backgroundColor: p.primaryHex }}
                              />
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-white"
                                style={{ backgroundColor: p.secondaryHex }}
                              />
                              {p.mode === 'tri-color' && p.tertiaryHex && (
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-white"
                                  style={{ backgroundColor: p.tertiaryHex }}
                                />
                              )}
                            </span>
                            <span>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Color Blend Style Selector (1, 2, or 3 Colors) */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        2B. Choose Single or Multi-Color Style
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {COLOR_MODES.map((m) => {
                          const active = config.colorMode === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleModeChange(m.id)}
                              className={`min-h-[48px] px-2.5 py-2 rounded-xl border text-left transition-all ${
                                active
                                  ? 'bg-[#0B1117] text-white border-[#0B1117]'
                                  : 'bg-white text-[#0B1117] border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div className="text-xs font-semibold">{m.label}</div>
                              <div
                                className={`text-[10px] mt-0.5 ${
                                  active ? 'text-[#5EEAD4]' : 'text-[#475569]'
                                }`}
                              >
                                {m.hint}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Streamlined Multi-Color Slot Selector (keeps UI clean!) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0B1117]">
                          2C. Tap a Color Slot to Edit
                        </span>
                        {config.colorMode !== 'solid' && (
                          <button
                            type="button"
                            onClick={handleSwapColors}
                            className="text-[11px] font-semibold text-[#0085CA] hover:text-[#0B1117] inline-flex items-center gap-1 transition-colors"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            <span>Swap Colors</span>
                          </button>
                        )}
                      </div>

                      <div
                        className={`grid gap-2 ${
                          config.colorMode === 'solid'
                            ? 'grid-cols-1'
                            : config.colorMode === 'tri-color'
                              ? 'grid-cols-3'
                              : 'grid-cols-2'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveColorSlot(1)}
                          className={`min-h-[46px] px-3 py-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                            activeColorSlot === 1
                              ? 'bg-[#F0F9FC] border-[#0085CA] ring-1 ring-[#0085CA]'
                              : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-lg border border-black/15 shrink-0"
                            style={{ backgroundColor: config.primaryHex }}
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-[#0B1117] truncate">
                              {config.colorMode === 'solid' ? 'Main Color' : '1. Body'}
                            </div>
                            <div className="text-[10px] font-mono text-[#475569] tabular-nums">
                              {config.primaryHex}
                            </div>
                          </div>
                        </button>

                        {config.colorMode !== 'solid' && (
                          <button
                            type="button"
                            onClick={() => setActiveColorSlot(2)}
                            className={`min-h-[46px] px-3 py-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                              activeColorSlot === 2
                                ? 'bg-[#F0F9FC] border-[#0085CA] ring-1 ring-[#0085CA]'
                                : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-lg border border-black/15 shrink-0"
                              style={{ backgroundColor: config.secondaryHex }}
                            />
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-[#0B1117] truncate">
                                {config.colorMode === 'two-tone'
                                  ? '2. Lid Trim'
                                  : config.colorMode === 'tri-color'
                                    ? '2. Mid Fade'
                                    : config.colorMode === 'ombre'
                                      ? '2. Top Fade'
                                      : '2. Silk Shift'}
                              </div>
                              <div className="text-[10px] font-mono text-[#475569] tabular-nums">
                                {config.secondaryHex}
                              </div>
                            </div>
                          </button>
                        )}

                        {config.colorMode === 'tri-color' && (
                          <button
                            type="button"
                            onClick={() => setActiveColorSlot(3)}
                            className={`min-h-[46px] px-3 py-2 rounded-xl border flex items-center gap-2 text-left transition-all ${
                              activeColorSlot === 3
                                ? 'bg-[#F0F9FC] border-[#009CA6] ring-1 ring-[#009CA6]'
                                : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                            }`}
                          >
                            <span
                              className="w-6 h-6 rounded-lg border border-black/15 shrink-0"
                              style={{ backgroundColor: tertiaryHex }}
                            />
                            <div className="min-w-0">
                              <div className="text-[11px] font-semibold text-[#0B1117] truncate">
                                3. Lid Accent
                              </div>
                              <div className="text-[10px] font-mono text-[#475569] tabular-nums">
                                {tertiaryHex}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      {/* Single Active Full-Spectrum Picker */}
                      <SpectrumColorPicker
                        label={
                          activeColorSlot === 1
                            ? config.colorMode === 'solid'
                              ? 'Editing Main Purse Color'
                              : 'Editing Color 1 · Purse Body'
                            : activeColorSlot === 2
                              ? config.colorMode === 'two-tone'
                                ? 'Editing Color 2 · Lid & Handle'
                                : config.colorMode === 'tri-color'
                                  ? 'Editing Color 2 · Mid Blend'
                                  : 'Editing Color 2 · Blend Shade'
                              : 'Editing Color 3 · Lid & Top Accent'
                        }
                        value={
                          activeColorSlot === 1
                            ? config.primaryHex
                            : activeColorSlot === 2
                              ? config.secondaryHex
                              : tertiaryHex
                        }
                        onChange={(hex) => {
                          if (activeColorSlot === 1) update({ primaryHex: hex });
                          else if (activeColorSlot === 2) update({ secondaryHex: hex });
                          else update({ tertiaryHex: hex });
                        }}
                        compact
                      />
                    </div>

                    {/* Finish & Hardware */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        Surface Sheen
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {FINISH_OPTIONS.map((f) => {
                          const active = config.finish === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => update({ finish: f.id })}
                              className={`min-h-[48px] p-2.5 rounded-xl border text-left transition-all ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA]'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div className="text-xs font-semibold text-[#0B1117]">
                                {f.name}
                              </div>
                              <div className="text-[11px] text-[#475569]">{f.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        Clasp &amp; Plaque Hardware
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {HARDWARE_OPTIONS.map((hw) => {
                          const active = config.hardwareFinish === hw.id;
                          return (
                            <button
                              key={hw.id}
                              type="button"
                              onClick={() => update({ hardwareFinish: hw.id })}
                              className={`min-h-[44px] px-3 py-2 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA]'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <span
                                className="w-5 h-5 rounded-full border border-black/15 shrink-0"
                                style={{
                                  backgroundColor:
                                    hw.id === 'matched' ? config.secondaryHex : hw.hex,
                                }}
                              />
                              <span className="text-xs font-semibold text-[#0B1117]">
                                {hw.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 3: HANDLES, CLASP & MONOGRAM */}
                {step === 3 && (
                  <>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        Carry &amp; Strap Style
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PURSE_HANDLES.map((h) => {
                          const active = config.handle === h.id;
                          return (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => update({ handle: h.id })}
                              className={`min-h-[54px] p-3 rounded-2xl border text-left transition-all ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA]'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div className="text-xs font-semibold text-[#0B1117]">
                                {h.name}
                              </div>
                              <div className="text-[11px] text-[#475569] mt-0.5">
                                {h.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        Closure Style
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {PURSE_CLASPS.map((cl) => {
                          const active = config.clasp === cl.id;
                          return (
                            <button
                              key={cl.id}
                              type="button"
                              onClick={() => update({ clasp: cl.id })}
                              className={`min-h-[54px] p-3 rounded-2xl border text-left transition-all ${
                                active
                                  ? 'bg-[#F0F9FC] border-[#0085CA]'
                                  : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              <div className="text-xs font-semibold text-[#0B1117]">
                                {cl.name}
                              </div>
                              <div className="text-[11px] text-[#475569] mt-0.5">
                                {cl.desc}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#0B1117]">
                        Front Monogram Plaque
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {PURSE_BADGES.map((b) => {
                          const active = config.badge === b.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => update({ badge: b.id })}
                              className={`min-h-[42px] px-2 py-2 rounded-xl border text-xs font-semibold transition-all ${
                                active
                                  ? 'bg-[#0B1117] text-white border-[#0B1117]'
                                  : 'bg-white text-[#0B1117] border-[#DCE4EC] hover:border-[#94A3B8]'
                              }`}
                            >
                              {b.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {config.badge !== 'none' && (
                      <div className="space-y-1.5">
                        <label
                          htmlFor="studioMonogramInput"
                          className="block text-xs font-semibold text-[#0B1117]"
                        >
                          Personal Initials (Up to 4 Letters)
                        </label>
                        <input
                          id="studioMonogramInput"
                          type="text"
                          maxLength={4}
                          value={config.monogram}
                          onChange={(e) =>
                            update({ monogram: e.target.value.toUpperCase() })
                          }
                          placeholder="e.g. CLT, JM"
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] focus:border-[#0085CA] focus:bg-white focus:outline-none font-serif font-bold text-2xl tracking-[0.22em] uppercase text-center text-[#0B1117]"
                        />
                      </div>
                    )}

                    {/* Friendly Peek Inside Lid Slider */}
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#0B1117]">
                        <span>Peek Inside Your Bag</span>
                        <span className="text-[#0085CA]">
                          {config.lidAngle <= 4
                            ? 'Closed'
                            : config.lidAngle < 48
                              ? 'Slightly Open'
                              : 'Open Wide'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={105}
                        value={config.lidAngle}
                        onChange={(e) => update({ lidAngle: Number(e.target.value) })}
                        className="atelier-range"
                        aria-label="Peek inside lid angle"
                      />
                    </div>
                  </>
                )}

                {/* STEP 4: REVIEW, OUTFIT NOTE & SUMMARY */}
                {step === 4 && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">Silhouette &amp; Size</span>
                        <span className="font-semibold text-[#0B1117]">
                          {shapeSpec.name} · {sizeSpec.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">Surface Feel</span>
                        <span className="font-semibold text-[#0B1117]">
                          {textureSpec.name} · {finishSpec.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">Color Recipe</span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#0B1117]">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/15"
                            style={{ backgroundColor: config.primaryHex }}
                          />
                          {config.colorMode !== 'solid' && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15"
                              style={{ backgroundColor: config.secondaryHex }}
                            />
                          )}
                          {config.colorMode === 'tri-color' && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/15"
                              style={{ backgroundColor: tertiaryHex }}
                            />
                          )}
                          <span className="capitalize">{config.colorMode}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#475569]">Monogram</span>
                        <span className="font-semibold text-[#0B1117]">
                          {config.badge === 'none'
                            ? 'Clean Front (No Plaque)'
                            : config.monogram.trim() || 'Blank Medallion'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="studioGiftNote"
                        className="block text-xs font-semibold text-[#0B1117]"
                      >
                        Optional Outfit Match or Gift Note
                      </label>
                      <input
                        id="studioGiftNote"
                        type="text"
                        maxLength={90}
                        value={config.giftNote}
                        onChange={(e) => update({ giftNote: e.target.value })}
                        placeholder="e.g. Matching my blue & teal game-day outfit!"
                        className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] focus:border-[#0085CA] focus:bg-white focus:outline-none text-xs text-[#0B1117]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Guided Next / Back Row */}
              <div className="px-6 py-3 border-t border-[#EEF3F7] flex items-center justify-between gap-2 bg-[#F8FAFC]">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  className="min-h-[40px] px-3 py-1.5 rounded-full text-xs font-semibold text-[#475569] hover:text-[#0B1117] hover:bg-[#EEF3F7] disabled:opacity-30 inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="text-[11px] font-medium text-[#475569] tabular-nums whitespace-nowrap">
                  Step {step} of 4
                </span>
                {step < 4 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(4, s + 1))}
                    className="min-h-[40px] px-4 py-1.5 rounded-full bg-[#0B1117] hover:bg-[#0085CA] text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors whitespace-nowrap"
                  >
                    <span>{currentMeta.nextLabel}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-[#009CA6] whitespace-nowrap">
                    Ready to Add
                  </span>
                )}
              </div>

              {/* Pricing & Primary Action Footer */}
              <div className="p-5 sm:p-6 border-t border-[#DCE4EC] bg-white space-y-3.5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-[#475569]">Custom Purse Total</div>
                    <div className="font-serif text-3xl font-bold text-[#0B1117] tabular-nums leading-tight">
                      ${price}
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#475569]">
                    <div className="font-semibold text-[#009CA6]">
                      Hand-finished in Charlotte
                    </div>
                    <div>Ready in 3–5 days · Free pickup</div>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sharePublicly}
                    onChange={(e) => setSharePublicly(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] accent-[#0085CA] shrink-0"
                  />
                  <span className="text-[11px] text-[#475569] leading-snug">
                    <strong className="font-semibold text-[#0B1117]">
                      Share to Community Inspirations when saving
                    </strong>{' '}
                    — displays your color recipe and first name only (you can unshare anytime).
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onAddToBag(config, price)}
                    className="sm:col-span-8 min-h-[48px] px-5 py-3 rounded-full bg-[#0085CA] hover:bg-[#006BA3] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add Purse to Bag</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => onSaveDesign(config, price, sharePublicly)}
                    className="sm:col-span-4 min-h-[48px] px-4 py-3 rounded-full bg-[#EEF3F7] hover:bg-[#DCE4EC] text-[#0B1117] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Bookmark className="w-4 h-4 text-[#009CA6]" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>

                {/* Discreet Collapsible Atelier Owner STL Export Panel */}
                <div className="pt-1 border-t border-[#EEF3F7]">
                  <button
                    type="button"
                    onClick={() => setOwnerOpen((o) => !o)}
                    className="w-full py-1.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#64748B] hover:text-[#0B1117] transition-colors"
                  >
                    <span>Atelier Owner Tools (Print .STL Export)</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        ownerOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {ownerOpen && (
                    <div className="mt-2 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] space-y-2.5 text-center">
                      <div className="text-[11px] text-[#475569] tabular-nums">
                        Print Envelope: {dims.width} × {dims.depth} × {dims.height} mm (+
                        {dims.lidHeight} mm Lid)
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleExportStl('full')}
                          className="min-h-[38px] px-2 py-2 rounded-xl bg-white hover:bg-[#0B1117] hover:text-white border border-[#DCE4EC] text-[11px] font-semibold text-[#0B1117] inline-flex items-center justify-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Full .STL</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportStl('body')}
                          className="min-h-[38px] px-2 py-2 rounded-xl bg-white hover:bg-[#0B1117] hover:text-white border border-[#DCE4EC] text-[11px] font-semibold text-[#0B1117] inline-flex items-center justify-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Body</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportStl('lid')}
                          className="min-h-[38px] px-2 py-2 rounded-xl bg-white hover:bg-[#0B1117] hover:text-white border border-[#DCE4EC] text-[11px] font-semibold text-[#0B1117] inline-flex items-center justify-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          <span>Lid</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
