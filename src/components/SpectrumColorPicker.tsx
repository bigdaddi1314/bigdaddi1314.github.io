import React, { useCallback, useMemo, useRef, useState } from 'react';
import { CURATED_SWATCHES } from '../config/storefrontConfig';

interface SpectrumColorPickerProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  compact?: boolean;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { h: 200, s: 100, v: 79 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      default:
        h = ((r - g) / d + 4) * 60;
    }
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;
  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

function hsvToHex(h: number, s: number, v: number): string {
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const val = Math.max(0, Math.min(100, v)) / 100;
  const c = val * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export const SpectrumColorPicker: React.FC<SpectrumColorPickerProps> = ({
  label,
  value,
  onChange,
  compact = false,
}) => {
  const [tab, setTab] = useState<'swatches' | 'spectrum'>('swatches');
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const hsv = useMemo(() => hexToHsv(value), [value]);

  const matchedName = useMemo(() => {
    const found = CURATED_SWATCHES.find(
      (s) => s.hex.toLowerCase() === value.toLowerCase()
    );
    return found ? found.name : `Custom ${value.toUpperCase()}`;
  }, [value]);

  const shadeVariations = useMemo(() => {
    const sat = Math.max(45, hsv.s || 78);
    return [
      { label: 'Ice', hex: hsvToHex(hsv.h, Math.min(35, sat), 96) },
      { label: 'Pastel', hex: hsvToHex(hsv.h, Math.min(60, sat), 88) },
      { label: 'Vivid', hex: hsvToHex(hsv.h, Math.min(100, sat + 15), 82) },
      { label: 'Deep', hex: hsvToHex(hsv.h, Math.min(100, sat + 10), 42) },
    ];
  }, [hsv.h, hsv.s]);

  const updateFromPadPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      onChange(hsvToHex(hsv.h, Math.round(x * 100), Math.round((1 - y) * 100)));
    },
    [hsv.h, onChange]
  );

  return (
    <div className="space-y-3 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] p-3.5">
      {/* Header Row with Active Color Swatch + Mode Switch */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-6 h-6 rounded-lg border border-black/15 shrink-0 shadow-xs"
            style={{ backgroundColor: value }}
          />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#0B1117] truncate">{label}</div>
            <div className="text-[11px] text-[#475569] truncate tabular-nums">
              {matchedName}
            </div>
          </div>
        </div>

        <div className="inline-flex items-center p-0.5 rounded-lg bg-[#EEF3F7] border border-[#DCE4EC] shrink-0">
          <button
            type="button"
            onClick={() => setTab('swatches')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
              tab === 'swatches'
                ? 'bg-white text-[#0B1117] shadow-xs'
                : 'text-[#475569] hover:text-[#0B1117]'
            }`}
          >
            Swatches
          </button>
          <button
            type="button"
            onClick={() => setTab('spectrum')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
              tab === 'spectrum'
                ? 'bg-white text-[#0085CA] shadow-xs'
                : 'text-[#475569] hover:text-[#0B1117]'
            }`}
          >
            Full Spectrum
          </button>
        </div>
      </div>

      {tab === 'swatches' ? (
        <div className="space-y-2.5">
          {/* Curated Queen City + Editorial Spectrum Swatches */}
          <div
            className={`grid gap-1.5 ${
              compact ? 'grid-cols-6' : 'grid-cols-6 sm:grid-cols-9'
            }`}
          >
            {CURATED_SWATCHES.map((swatch) => {
              const active = swatch.hex.toLowerCase() === value.toLowerCase();
              return (
                <button
                  key={swatch.id}
                  type="button"
                  title={swatch.name}
                  aria-label={`Select ${swatch.name}`}
                  onClick={() => onChange(swatch.hex)}
                  className={`min-h-[38px] rounded-xl border flex items-center justify-center transition-transform ${
                    active
                      ? 'border-[#0B1117] ring-2 ring-[#0085CA] ring-offset-1 scale-105'
                      : 'border-[#DCE4EC] hover:border-[#94A3B8]'
                  }`}
                  style={{ backgroundColor: '#FFFFFF' }}
                >
                  <span
                    className="w-6 h-6 rounded-lg border border-black/10 shadow-inner"
                    style={{ backgroundColor: swatch.hex }}
                  />
                </button>
              );
            })}
          </div>

          {/* Always-Accessible Quick Full-Spectrum Hue Bar right under swatches */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-[#475569]">
                Slide for any shade in the spectrum
              </span>
              <button
                type="button"
                onClick={() => setTab('spectrum')}
                className="font-semibold text-[#0085CA] hover:text-[#0B1117]"
              >
                Fine-tune shade →
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={359}
              value={hsv.h}
              aria-label={`Hue spectrum slider for ${label}`}
              onChange={(e) => {
                const newHue = Number(e.target.value);
                const sat = hsv.s < 20 ? 85 : hsv.s;
                const val = hsv.v < 25 ? 82 : hsv.v;
                onChange(hsvToHex(newHue, sat, val));
              }}
              className="hue-spectrum-range"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Interactive 2D Full-Spectrum Saturation × Brightness Canvas */}
          <div
            ref={padRef}
            role="slider"
            tabIndex={0}
            aria-label={`Saturation and brightness pad for ${label}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hsv.s}
            onPointerDown={(e) => {
              draggingRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              updateFromPadPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (!draggingRef.current) return;
              updateFromPadPointer(e.clientX, e.clientY);
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            className="relative h-32 w-full rounded-xl border border-[#CBD5E1] cursor-crosshair select-none touch-none overflow-hidden"
            style={{
              backgroundColor: hsvToHex(hsv.h, 100, 100),
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, #FFFFFF, rgba(255,255,255,0))',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))',
              }}
            />
            {/* Reticle */}
            <div
              className="pointer-events-none absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-white shadow-md ring-1 ring-[#0B1117]/60"
              style={{
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                backgroundColor: value,
              }}
            />
          </div>

          {/* Continuous 360° Hue Spectrum Bar */}
          <input
            type="range"
            min={0}
            max={359}
            value={hsv.h}
            aria-label={`Full spectrum hue bar for ${label}`}
            onChange={(e) => {
              const newHue = Number(e.target.value);
              const sat = hsv.s < 12 ? 85 : hsv.s;
              const val = hsv.v < 18 ? 82 : hsv.v;
              onChange(hsvToHex(newHue, sat, val));
            }}
            className="hue-spectrum-range"
          />

          {/* Tone Shortcuts + Direct Color Wheel & Hex */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {shadeVariations.map((tone) => (
                <button
                  key={tone.label}
                  type="button"
                  onClick={() => onChange(tone.hex)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#DCE4EC] hover:border-[#0085CA] text-[11px] font-medium text-[#0B1117] transition-colors"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black/15"
                    style={{ backgroundColor: tone.hex }}
                  />
                  <span>{tone.label}</span>
                </button>
              ))}
            </div>

            <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#0B1117] bg-white border border-[#DCE4EC] rounded-lg px-2 py-1 cursor-pointer">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value.toUpperCase())}
                aria-label={`Native color picker for ${label}`}
                className="w-4 h-4 border-0 bg-transparent cursor-pointer p-0"
              />
              <span className="tabular-nums">{value.toUpperCase()}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
