import React from 'react';
import type { AccessoryKind, EngravingFont, FinishType } from '../types/store';

interface AccessoryPreviewSVGProps {
  kind: AccessoryKind;
  primaryHex: string;
  accentHex: string;
  colorMode: 'solid' | 'two-tone' | 'ombre';
  finish: FinishType;
  engravingText: string;
  engravingFont: EngravingFont;
  className?: string;
}

function isDark(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length !== 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.48;
}

export const AccessoryPreviewSVG: React.FC<AccessoryPreviewSVGProps> = ({
  kind,
  primaryHex,
  accentHex,
  colorMode,
  finish,
  engravingText,
  engravingFont,
  className = '',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const gradId = `grad_${uid}`;
  const sheenId = `sheen_${uid}`;

  const effectiveAccent = colorMode === 'solid' ? primaryHex : accentHex;
  const bodyFill = colorMode === 'ombre' ? `url(#${gradId})` : primaryHex;
  const textInk = isDark(primaryHex) ? '#F8FAFC' : '#0B1117';
  const accentTextInk = isDark(effectiveAccent) ? '#F8FAFC' : '#0B1117';

  const fontFamily =
    engravingFont === 'editorial'
      ? '"Cormorant Garamond", Georgia, serif'
      : engravingFont === 'script'
        ? '"Cormorant Garamond", Georgia, serif'
        : '"Plus Jakarta Sans", sans-serif';

  const fontStyle = engravingFont === 'script' ? 'italic' : 'normal';
  const fontWeight = engravingFont === 'modern' ? 700 : 600;
  const sheenOpacity =
    finish === 'metallic' ? 0.42 : finish === 'pearl' ? 0.34 : finish === 'silk' ? 0.24 : 0.08;

  const text = engravingText.trim() || 'M704';

  return (
    <svg
      viewBox="0 0 320 260"
      className={`w-full h-full ${className}`}
      role="img"
      aria-label={`Custom ${kind} live preview`}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryHex} />
          <stop offset="100%" stopColor={accentHex} />
        </linearGradient>
        <linearGradient id={sheenId} x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={sheenOpacity} />
          <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="100%" stopColor="#0B1117" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      {/* Subtle studio shadow */}
      <ellipse cx="160" cy="222" rx="92" ry="16" fill="#0B1117" opacity="0.11" />

      {kind === 'grinder' && (
        <g>
          {/* Lower chamber */}
          <rect
            x="88"
            y="112"
            width="144"
            height="86"
            rx="18"
            fill={effectiveAccent}
            stroke="#0B1117"
            strokeOpacity="0.18"
            strokeWidth="2"
          />
          {/* Fluted vertical grip ribs */}
          {[104, 122, 140, 158, 176, 194, 212].map((x) => (
            <rect
              key={x}
              x={x}
              y="122"
              width="6"
              height="68"
              rx="3"
              fill="#FFFFFF"
              opacity="0.22"
            />
          ))}
          {/* Top Magnetic Lid */}
          <ellipse
            cx="160"
            cy="112"
            rx="74"
            ry="32"
            fill={bodyFill}
            stroke="#0B1117"
            strokeOpacity="0.22"
            strokeWidth="2"
          />
          <ellipse cx="160" cy="112" rx="74" ry="32" fill={`url(#${sheenId})`} />
          {/* Precision radial geometric bezel ring */}
          <ellipse
            cx="160"
            cy="109"
            rx="60"
            ry="23"
            fill="none"
            stroke={textInk}
            strokeOpacity="0.32"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          {/* Minimal architectural north/south/east/west alignment ticks */}
          <line x1="160" y1="84" x2="160" y2="91" stroke={textInk} strokeOpacity="0.45" strokeWidth="1.6" />
          <line x1="160" y1="127" x2="160" y2="134" stroke={textInk} strokeOpacity="0.45" strokeWidth="1.6" />
          <line x1="98" y1="109" x2="106" y2="109" stroke={textInk} strokeOpacity="0.45" strokeWidth="1.6" />
          <line x1="214" y1="109" x2="222" y2="109" stroke={textInk} strokeOpacity="0.45" strokeWidth="1.6" />
          <text
            x="160"
            y="114"
            textAnchor="middle"
            fill={textInk}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
            fontWeight={fontWeight}
            fontSize={text.length > 7 ? '15' : '19'}
            letterSpacing="2"
          >
            {text}
          </text>
        </g>
      )}

      {kind === 'rolling-tray' && (
        <g>
          {/* Outer curved rim */}
          <rect
            x="38"
            y="58"
            width="244"
            height="148"
            rx="34"
            fill={effectiveAccent}
            stroke="#0B1117"
            strokeOpacity="0.2"
            strokeWidth="2.5"
          />
          {/* Inner concave tray bed */}
          <rect
            x="54"
            y="72"
            width="212"
            height="120"
            rx="24"
            fill={bodyFill}
            stroke="#FFFFFF"
            strokeOpacity="0.45"
            strokeWidth="2"
          />
          <rect x="54" y="72" width="212" height="120" rx="24" fill={`url(#${sheenId})`} />
          {/* Architectural geometric corner brackets & diamond emblem */}
          <path
            d="M72 96 L72 86 L86 86 M248 96 L248 86 L234 86 M72 168 L72 178 L86 178 M248 168 L248 178 L234 178"
            fill="none"
            stroke={textInk}
            strokeOpacity="0.34"
            strokeWidth="1.8"
          />
          <polygon
            points="160,94 166,100 160,106 154,100"
            fill={textInk}
            opacity="0.35"
          />
          <line x1="120" y1="158" x2="200" y2="158" stroke={textInk} strokeOpacity="0.28" strokeWidth="1.4" />
          <text
            x="160"
            y="138"
            textAnchor="middle"
            fill={textInk}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
            fontWeight={fontWeight}
            fontSize={text.length > 11 ? '17' : '22'}
            letterSpacing="2.5"
          >
            {text}
          </text>
        </g>
      )}

      {kind === 'ashtray' && (
        <g>
          {/* Faceted Octagonal Outer Body */}
          <polygon
            points="108,54 212,54 256,98 256,170 212,212 108,212 64,170 64,98"
            fill={bodyFill}
            stroke="#0B1117"
            strokeOpacity="0.24"
            strokeWidth="2"
          />
          <polygon
            points="108,54 212,54 256,98 256,170 212,212 108,212 64,170 64,98"
            fill={`url(#${sheenId})`}
          />
          {/* Contrasting geometric bevel facets */}
          <polygon points="108,54 212,54 196,76 124,76" fill={effectiveAccent} opacity="0.82" />
          <polygon points="108,212 212,212 196,190 124,190" fill={effectiveAccent} opacity="0.82" />
          {/* Rest grooves */}
          <rect x="152" y="54" width="16" height="22" rx="4" fill="#0B1117" opacity="0.22" />
          <rect x="152" y="190" width="16" height="22" rx="4" fill="#0B1117" opacity="0.22" />
          {/* Inner recessed bowl */}
          <circle
            cx="160"
            cy="133"
            r="54"
            fill={effectiveAccent}
            stroke="#FFFFFF"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          <circle cx="160" cy="133" r="46" fill="#0B1117" opacity="0.18" />
          <text
            x="160"
            y="138"
            textAnchor="middle"
            fill={accentTextInk}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
            fontWeight={fontWeight}
            fontSize={text.length > 8 ? '13' : '16'}
            letterSpacing="2"
          >
            {text}
          </text>
        </g>
      )}

      {kind === 'lighter-sleeve' && (
        <g>
          {/* Metallic lighter cap sticking out top */}
          <rect x="128" y="34" width="64" height="36" rx="8" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.5" />
          <rect x="166" y="42" width="18" height="14" rx="4" fill="#0085CA" />
          <rect x="134" y="40" width="22" height="24" rx="3" fill="#94A3B8" />
          {/* Sculpted Textured Grip Sleeve Body */}
          <rect
            x="116"
            y="66"
            width="88"
            height="148"
            rx="20"
            fill={bodyFill}
            stroke="#0B1117"
            strokeOpacity="0.2"
            strokeWidth="2"
          />
          <rect x="116" y="66" width="88" height="148" rx="20" fill={`url(#${sheenId})`} />
          {/* Minimal geometric knurl grip lines */}
          {[94, 188, 198].map((yPos) => (
            <line
              key={yPos}
              x1="126"
              y1={yPos}
              x2="194"
              y2={yPos}
              stroke="#FFFFFF"
              strokeOpacity="0.22"
              strokeWidth="1.5"
            />
          ))}
          {/* Accent trim collar */}
          <rect x="116" y="66" width="88" height="16" rx="6" fill={effectiveAccent} />
          {/* Engraved vertical plaque */}
          <rect
            x="134"
            y="104"
            width="52"
            height="76"
            rx="10"
            fill={effectiveAccent}
            stroke="#FFFFFF"
            strokeOpacity="0.45"
            strokeWidth="1.5"
          />
          <text
            x="160"
            y="148"
            textAnchor="middle"
            fill={accentTextInk}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
            fontWeight={fontWeight}
            fontSize={text.length > 4 ? '14' : '18'}
            letterSpacing="2"
          >
            {text}
          </text>
        </g>
      )}

      {(kind === 'bag-charm' || kind === 'keychain') && (
        <g>
          {/* Metallic clasp & ring */}
          <circle cx="160" cy="48" r="18" fill="none" stroke="#94A3B8" strokeWidth="6" />
          <rect x="155" y="64" width="10" height="24" rx="5" fill="#CBD5E1" />
          {kind === 'bag-charm' ? (
            <>
              {/* Sculpted Charlotte Crown Charm */}
              <path
                d="M92 178 L104 102 L134 132 L160 88 L186 132 L216 102 L228 178 Z"
                fill={bodyFill}
                stroke="#0B1117"
                strokeOpacity="0.2"
                strokeWidth="2"
              />
              <path
                d="M92 178 L104 102 L134 132 L160 88 L186 132 L216 102 L228 178 Z"
                fill={`url(#${sheenId})`}
              />
              <rect x="96" y="176" width="128" height="22" rx="10" fill={effectiveAccent} />
              <text
                x="160"
                y="192"
                textAnchor="middle"
                fill={accentTextInk}
                fontFamily={fontFamily}
                fontStyle={fontStyle}
                fontWeight={fontWeight}
                fontSize="13"
                letterSpacing="2.2"
              >
                {text}
              </text>
            </>
          ) : (
            <>
              {/* Sculpted Heart Keychain */}
              <path
                d="M160 202 C108 168 88 130 108 102 C124 80 150 92 160 108 C170 92 196 80 212 102 C232 130 212 168 160 202 Z"
                fill={bodyFill}
                stroke={effectiveAccent}
                strokeWidth="7"
              />
              <path
                d="M160 202 C108 168 88 130 108 102 C124 80 150 92 160 108 C170 92 196 80 212 102 C232 130 212 168 160 202 Z"
                fill={`url(#${sheenId})`}
              />
              <text
                x="160"
                y="148"
                textAnchor="middle"
                fill={textInk}
                fontFamily={fontFamily}
                fontStyle={fontStyle}
                fontWeight={fontWeight}
                fontSize={text.length > 5 ? '16' : '22'}
                letterSpacing="2"
              >
                {text}
              </text>
            </>
          )}
        </g>
      )}

      {(kind === 'vanity-tray' || kind === 'earring-stand') && (
        <g>
          {kind === 'vanity-tray' ? (
            <>
              <ellipse
                cx="160"
                cy="134"
                rx="116"
                ry="72"
                fill={effectiveAccent}
                stroke="#0B1117"
                strokeOpacity="0.18"
                strokeWidth="2"
              />
              <ellipse
                cx="160"
                cy="134"
                rx="98"
                ry="56"
                fill={bodyFill}
                stroke="#FFFFFF"
                strokeOpacity="0.55"
                strokeWidth="2"
              />
              <ellipse cx="160" cy="134" rx="98" ry="56" fill={`url(#${sheenId})`} />
              <text
                x="160"
                y="140"
                textAnchor="middle"
                fill={textInk}
                fontFamily={fontFamily}
                fontStyle={fontStyle}
                fontWeight={fontWeight}
                fontSize={text.length > 10 ? '15' : '20'}
                letterSpacing="2.4"
              >
                {text}
              </text>
            </>
          ) : (
            <>
              {/* Sculpted Arch Earring Stand */}
              <path
                d="M96 190 L96 106 A64 64 0 0 1 224 106 L224 190 Z"
                fill={bodyFill}
                stroke="#0B1117"
                strokeOpacity="0.2"
                strokeWidth="2"
              />
              <path
                d="M96 190 L96 106 A64 64 0 0 1 224 106 L224 190 Z"
                fill={`url(#${sheenId})`}
              />
              {/* Stud holes */}
              {[124, 148, 172, 196].map((x) => (
                <React.Fragment key={x}>
                  <circle cx={x} cy="108" r="3" fill={effectiveAccent} />
                  <circle cx={x} cy="134" r="3" fill={effectiveAccent} />
                </React.Fragment>
              ))}
              {/* Base pedestal */}
              <rect x="74" y="184" width="172" height="28" rx="12" fill={effectiveAccent} />
              <text
                x="160"
                y="203"
                textAnchor="middle"
                fill={accentTextInk}
                fontFamily={fontFamily}
                fontStyle={fontStyle}
                fontWeight={fontWeight}
                fontSize="14"
                letterSpacing="2.4"
              >
                {text}
              </text>
            </>
          )}
        </g>
      )}
    </svg>
  );
};
