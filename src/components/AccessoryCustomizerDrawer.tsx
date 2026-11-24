import React, { useEffect, useState } from 'react';
import { Bookmark, ShoppingBag, X } from 'lucide-react';
import { FINISH_OPTIONS } from '../config/storefrontConfig';
import type { AccessoryConfig, CatalogItem, EngravingFont } from '../types/store';
import { AccessoryPreviewSVG } from './AccessoryPreviewSVG';
import { SpectrumColorPicker } from './SpectrumColorPicker';

interface AccessoryCustomizerDrawerProps {
  item: CatalogItem | null;
  initialConfig?: AccessoryConfig | null;
  onClose: () => void;
  onAddToBag: (cfg: AccessoryConfig, price: number) => void;
  onSaveDesign: (cfg: AccessoryConfig, price: number, sharePublicly?: boolean) => void;
  isSaving?: boolean;
}

export const AccessoryCustomizerDrawer: React.FC<AccessoryCustomizerDrawerProps> = ({
  item,
  initialConfig,
  onClose,
  onAddToBag,
  onSaveDesign,
  isSaving = false,
}) => {
  const [config, setConfig] = useState<AccessoryConfig | null>(null);
  const [sharePublicly, setSharePublicly] = useState<boolean>(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      return;
    }
    if (item && item.accessoryKind) {
      setConfig({
        productId: item.id,
        productName: item.name,
        accessoryKind: item.accessoryKind,
        colorMode: 'two-tone',
        primaryHex: item.defaultPrimaryHex,
        accentHex: item.defaultAccentHex,
        finish: 'silk',
        engravingText: item.defaultEngraving || 'CLT',
        engravingFont: 'editorial',
        basePrice: item.price,
      });
    } else {
      setConfig(null);
    }
  }, [item, initialConfig]);

  if (!config) return null;

  const maxChars = item?.maxEngravingChars ?? 14;
  const totalPrice =
    config.basePrice +
    (config.colorMode !== 'solid' ? 4 : 0) +
    (config.engravingText.trim().length > 0 ? 4 : 0);

  const update = (patch: Partial<AccessoryConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : null));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#0B1117]/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative z-10 w-full max-w-lg bg-white h-full border-l border-[#DCE4EC] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#DCE4EC] flex items-center justify-between bg-[#F8FAFC]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#009CA6]">
              Live Accessory Customizer
            </p>
            <h3 className="font-serif text-2xl font-semibold text-[#0B1117]">
              {config.productName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customizer"
            className="min-h-[44px] min-w-[44px] rounded-full bg-white border border-[#DCE4EC] hover:border-[#0B1117] flex items-center justify-center text-[#0B1117] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Live Interactive Preview Stage */}
          <div className="rounded-3xl bg-gradient-to-b from-[#F8FAFC] to-[#EEF3F7] border border-[#DCE4EC] p-4 h-60 flex items-center justify-center relative">
            <AccessoryPreviewSVG
              kind={config.accessoryKind}
              primaryHex={config.primaryHex}
              accentHex={config.accentHex}
              colorMode={config.colorMode}
              finish={config.finish}
              engravingText={config.engravingText}
              engravingFont={config.engravingFont}
            />
            <div className="absolute bottom-3 right-3 text-[11px] text-[#475569] font-medium">
              Live Color &amp; Engraving Preview
            </div>
          </div>

          {/* Personalized Engraving */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="accEngravingInput"
                className="text-xs font-semibold text-[#0B1117]"
              >
                Personalized Engraving Text
              </label>
              <span className="text-[11px] text-[#475569] tabular-nums">
                {config.engravingText.length} / {maxChars}
              </span>
            </div>
            <input
              id="accEngravingInput"
              type="text"
              maxLength={maxChars}
              value={config.engravingText}
              onChange={(e) => update({ engravingText: e.target.value })}
              placeholder="Name, initials, or short phrase"
              className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] focus:border-[#0085CA] focus:bg-white focus:outline-none text-sm font-semibold text-[#0B1117]"
            />

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'editorial', label: 'Editorial Serif' },
                  { id: 'script', label: 'Signature Script' },
                  { id: 'modern', label: 'Bold Block' },
                ] as Array<{ id: EngravingFont; label: string }>
              ).map((font) => {
                const active = config.engravingFont === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => update({ engravingFont: font.id })}
                    className={`min-h-[42px] px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#0B1117] text-white border-[#0B1117]'
                        : 'bg-white text-[#0B1117] border-[#DCE4EC] hover:border-[#94A3B8]'
                    }`}
                  >
                    {font.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Mode */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#0B1117]">Color Theme Style</div>
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'two-tone', 'ombre'] as const).map((mode) => {
                const active = config.colorMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update({ colorMode: mode })}
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-semibold capitalize transition-colors ${
                      active
                        ? 'bg-[#0085CA] text-white border-[#0085CA]'
                        : 'bg-white text-[#0B1117] border-[#DCE4EC] hover:border-[#94A3B8]'
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Color */}
          <SpectrumColorPicker
            label="Primary Body Color"
            value={config.primaryHex}
            onChange={(hex) => update({ primaryHex: hex })}
            compact
          />

          {/* Accent Color */}
          {config.colorMode !== 'solid' && (
            <SpectrumColorPicker
              label="Accent / Rim & Trim Color"
              value={config.accentHex}
              onChange={(hex) => update({ accentHex: hex })}
              compact
            />
          )}

          {/* Finish Selector */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#0B1117]">Surface Finish</div>
            <div className="grid grid-cols-2 gap-2">
              {FINISH_OPTIONS.map((f) => {
                const active = config.finish === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => update({ finish: f.id })}
                    className={`min-h-[46px] p-2.5 rounded-xl border text-left transition-all ${
                      active
                        ? 'bg-[#F0F9FC] border-[#0085CA]'
                        : 'bg-white border-[#DCE4EC] hover:border-[#94A3B8]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#0B1117]">{f.name}</div>
                    <div className="text-[11px] text-[#475569]">{f.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-5 border-t border-[#DCE4EC] bg-[#F8FAFC] pb-safe space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#475569]">Custom Engraved Piece</span>
            <span className="font-serif text-3xl font-bold text-[#0B1117] tabular-nums">
              ${totalPrice}
            </span>
          </div>
          <label className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-white border border-[#DCE4EC] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sharePublicly}
              onChange={(e) => setSharePublicly(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-[#CBD5E1] accent-[#0085CA] shrink-0"
            />
            <span className="text-[11px] text-[#475569] leading-snug">
              <strong className="font-semibold text-[#0B1117]">
                Share publicly in Community Inspirations
              </strong>{' '}
              when saving (first name &amp; design only).
            </span>
          </label>
          <div className="grid grid-cols-12 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onAddToBag(config, totalPrice);
                onClose();
              }}
              className="col-span-8 min-h-[48px] px-4 py-3 rounded-full bg-[#0085CA] hover:bg-[#006BA3] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Custom Piece</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSaveDesign(config, totalPrice, sharePublicly)}
              className="col-span-4 min-h-[48px] px-3 py-3 rounded-full bg-white border border-[#DCE4EC] hover:border-[#0B1117] text-[#0B1117] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Bookmark className="w-4 h-4 text-[#009CA6]" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
