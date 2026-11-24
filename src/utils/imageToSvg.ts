/**
 * Client-side 3D-Print-Ready Image -> Vector SVG Converter
 *
 * Converts everyday customer photos, logos, PNGs, JPGs, and screenshots into
 * clean, closed, slicer-ready SVG <path> vectors using:
 *  - Alpha & corner-color smart background removal
 *  - Automatic Otsu thresholding (zero manual tuning required on upload)
 *  - Marching Squares closed contour tracing (with inner-hole evenodd support)
 *  - Ramer-Douglas-Peucker simplification + quadratic Bezier smoothing
 *  - Minimum printable feature filtering (removes tiny unprintable speckles)
 */

export type VectorizeMode = 'logo' | 'photo' | 'stamp';

export interface VectorizeOptions {
  mode: VectorizeMode;
  threshold?: number; // 0..255; omitted -> auto Otsu
  smoothness: number; // 0..10 (default 3)
  removeBackground: boolean;
  invert: boolean;
  fillColor: string;
  secondaryColor?: string;
  physicalWidthMm?: number; // default 60mm for slicer export
}

export interface VectorizeResult {
  svgString: string;
  innerMarkup: string;
  viewBox: { x: number; y: number; w: number; h: number };
  aspect: number;
  pathCount: number;
  pointCount: number;
  autoThreshold: number;
  previewDataUrl: string;
  isNativeSvg?: boolean;
}

interface Pt {
  x: number;
  y: number;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode uploaded image.'));
    img.src = src;
  });
}

function computeOtsuThreshold(luma: Uint8Array, mask: Uint8Array): number {
  const hist = new Uint32Array(256);
  let total = 0;
  for (let i = 0; i < luma.length; i++) {
    if (mask[i]) {
      hist[luma[i]]++;
      total++;
    }
  }
  if (total === 0) return 128;

  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0;
  let wB = 0;
  let maxVar = -1;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const diff = mB - mF;
    const between = wB * wF * diff * diff;
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return Math.max(35, Math.min(225, threshold));
}

function estimateCornerBackground(
  rgba: Uint8ClampedArray,
  w: number,
  h: number
): { hasSolidBg: boolean; r: number; g: number; b: number; hasAlpha: boolean } {
  let transparentCount = 0;
  const totalPx = w * h;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] < 200) transparentCount++;
  }
  if (transparentCount > totalPx * 0.04) {
    return { hasSolidBg: false, r: 255, g: 255, b: 255, hasAlpha: true };
  }

  const samples: Array<[number, number, number]> = [];
  const stepX = Math.max(1, Math.floor(w / 10));
  const stepY = Math.max(1, Math.floor(h / 10));
  const pushPx = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    samples.push([rgba[idx], rgba[idx + 1], rgba[idx + 2]]);
  };
  for (let x = 0; x < w; x += stepX) {
    pushPx(x, 0);
    pushPx(x, h - 1);
  }
  for (let y = 0; y < h; y += stepY) {
    pushPx(0, y);
    pushPx(w - 1, y);
  }

  let r = 0,
    g = 0,
    b = 0;
  for (const s of samples) {
    r += s[0];
    g += s[1];
    b += s[2];
  }
  r /= samples.length;
  g /= samples.length;
  b /= samples.length;

  // Check if border pixels are reasonably uniform (solid backdrop like white/black/studio)
  let matchCount = 0;
  for (const s of samples) {
    const dist = Math.hypot(s[0] - r, s[1] - g, s[2] - b);
    if (dist < 42) matchCount++;
  }
  return {
    hasSolidBg: matchCount >= samples.length * 0.65,
    r,
    g,
    b,
    hasAlpha: false,
  };
}

// Flood-fill from image borders to remove only exterior background matching bg RGB
function buildBackgroundMask(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  bgR: number,
  bgG: number,
  bgB: number,
  tolerance: number
): Uint8Array {
  const isBg = new Uint8Array(w * h);
  const visited = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;

  const trySeed = (x: number, y: number) => {
    const pos = y * w + x;
    if (visited[pos]) return;
    const idx = pos * 4;
    const dist = Math.hypot(rgba[idx] - bgR, rgba[idx + 1] - bgG, rgba[idx + 2] - bgB);
    if (dist <= tolerance) {
      visited[pos] = 1;
      isBg[pos] = 1;
      queue[tail++] = pos;
    }
  };

  for (let x = 0; x < w; x++) {
    trySeed(x, 0);
    trySeed(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y);
    trySeed(w - 1, y);
  }

  while (head < tail) {
    const pos = queue[head++];
    const x = pos % w;
    const y = (pos - x) / w;
    if (x > 0) trySeed(x - 1, y);
    if (x + 1 < w) trySeed(x + 1, y);
    if (y > 0) trySeed(x, y - 1);
    if (y + 1 < h) trySeed(x, y + 1);
  }
  return isBg;
}

// 3x3 majority despeckle pass to eliminate single-pixel noise before tracing
function despeckle(grid: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(grid.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          sum += grid[ny * w + nx];
        }
      }
      const center = grid[y * w + x];
      out[y * w + x] = sum >= 5 ? 1 : sum <= 3 ? 0 : center;
    }
  }
  return out;
}

// Marching Squares closed contour tracer on padded binary grid
function traceContours(grid: Uint8Array, w: number, h: number): Pt[][] {
  const pw = w + 2;
  const ph = h + 2;
  const pad = new Uint8Array(pw * ph);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      pad[(y + 1) * pw + (x + 1)] = grid[y * w + x];
    }
  }

  // Directed segments (in half-integer coordinates doubled to integers for exact Map keys)
  // Edge midpoints for cell (x,y) with corners TL(x,y), TR(x+1,y), BR(x+1,y+1), BL(x,y+1):
  // Top:    (2x+1, 2y)
  // Right:  (2x+2, 2y+1)
  // Bottom: (2x+1, 2y+2)
  // Left:   (2x,   2y+1)
  const adj = new Map<string, Array<{ toKey: string; x: number; y: number }>>();
  const addSeg = (x1: number, y1: number, x2: number, y2: number) => {
    const k1 = `${x1},${y1}`;
    const k2 = `${x2},${y2}`;
    let list = adj.get(k1);
    if (!list) {
      list = [];
      adj.set(k1, list);
    }
    list.push({ toKey: k2, x: x2 * 0.5 - 1, y: y2 * 0.5 - 1 });
  };

  for (let y = 0; y < ph - 1; y++) {
    for (let x = 0; x < pw - 1; x++) {
      const tl = pad[y * pw + x];
      const tr = pad[y * pw + x + 1];
      const br = pad[(y + 1) * pw + x + 1];
      const bl = pad[(y + 1) * pw + x];
      const code = (tl << 3) | (tr << 2) | (br << 1) | bl;
      if (code === 0 || code === 15) continue;

      const tx = 2 * x + 1, ty = 2 * y;
      const rx = 2 * x + 2, ry = 2 * y + 1;
      const bx = 2 * x + 1, by = 2 * y + 2;
      const lx = 2 * x, ly = 2 * y + 1;

      switch (code) {
        case 1: addSeg(lx, ly, bx, by); break;
        case 2: addSeg(bx, by, rx, ry); break;
        case 3: addSeg(lx, ly, rx, ry); break;
        case 4: addSeg(rx, ry, tx, ty); break;
        case 5: addSeg(lx, ly, tx, ty); addSeg(rx, ry, bx, by); break;
        case 6: addSeg(bx, by, tx, ty); break;
        case 7: addSeg(lx, ly, tx, ty); break;
        case 8: addSeg(tx, ty, lx, ly); break;
        case 9: addSeg(tx, ty, bx, by); break;
        case 10: addSeg(tx, ty, rx, ry); addSeg(bx, by, lx, ly); break;
        case 11: addSeg(tx, ty, rx, ry); break;
        case 12: addSeg(rx, ry, lx, ly); break;
        case 13: addSeg(rx, ry, bx, by); break;
        case 14: addSeg(bx, by, lx, ly); break;
      }
    }
  }

  const loops: Pt[][] = [];
  for (const [startKey, edges] of adj.entries()) {
    while (edges.length > 0) {
      const first = edges.pop()!;
      const pts: Pt[] = [];
      const [sx, sy] = startKey.split(',').map(Number);
      pts.push({ x: sx * 0.5 - 1, y: sy * 0.5 - 1 });
      pts.push({ x: first.x, y: first.y });
      let curKey = first.toKey;
      let guard = 0;
      while (curKey !== startKey && guard < 100000) {
        guard++;
        const nextEdges = adj.get(curKey);
        if (!nextEdges || nextEdges.length === 0) break;
        const next = nextEdges.pop()!;
        pts.push({ x: next.x, y: next.y });
        curKey = next.toKey;
      }
      if (pts.length >= 4) {
        pts.pop(); // remove duplicate closing vertex
        loops.push(pts);
      }
    }
  }
  return loops;
}

function polygonAreaAbs(pts: Pt[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) * 0.5;
}

function perpDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function simplifyClosedRDP(pts: Pt[], epsilon: number): Pt[] {
  if (pts.length <= 4 || epsilon <= 0) return pts;
  const rdp = (arr: Pt[]): Pt[] => {
    if (arr.length <= 2) return arr;
    let maxD = -1;
    let idx = 0;
    const first = arr[0];
    const last = arr[arr.length - 1];
    for (let i = 1; i < arr.length - 1; i++) {
      const d = perpDist(arr[i], first, last);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > epsilon) {
      const left = rdp(arr.slice(0, idx + 1));
      const right = rdp(arr.slice(idx));
      return left.slice(0, -1).concat(right);
    }
    return [first, last];
  };

  // Split closed ring at farthest point from index 0
  let farIdx = 1;
  let farDist = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[0].x, pts[i].y - pts[0].y);
    if (d > farDist) {
      farDist = d;
      farIdx = i;
    }
  }
  const h1 = rdp(pts.slice(0, farIdx + 1));
  const h2 = rdp(pts.slice(farIdx).concat([pts[0]]));
  return h1.slice(0, -1).concat(h2.slice(0, -1));
}

function chaikinSmoothClosed(pts: Pt[], iterations: number): Pt[] {
  let cur = pts;
  for (let it = 0; it < iterations; it++) {
    if (cur.length < 3 || cur.length > 450) break;
    const next: Pt[] = [];
    for (let i = 0; i < cur.length; i++) {
      const a = cur[i];
      const b = cur[(i + 1) % cur.length];
      next.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25 });
      next.push({ x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75 });
    }
    cur = next;
  }
  return cur;
}

function loopToSvgSubpath(pts: Pt[], useCurves: boolean): string {
  if (pts.length < 3) return '';
  if (!useCurves || pts.length < 4) {
    return (
      'M' +
      pts
        .map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join('L') +
      'Z'
    );
  }
  // Smooth closed quadratic Bezier spline through edge midpoints
  const n = pts.length;
  const startMidX = (pts[n - 1].x + pts[0].x) * 0.5;
  const startMidY = (pts[n - 1].y + pts[0].y) * 0.5;
  let d = `M${startMidX.toFixed(1)} ${startMidY.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % n];
    const mx = (p.x + next.x) * 0.5;
    const my = (p.y + next.y) * 0.5;
    d += `Q${p.x.toFixed(1)} ${p.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  return d + 'Z';
}

function traceBinaryGridToPathD(
  rawGrid: Uint8Array,
  w: number,
  h: number,
  smoothness: number,
  minAreaPx: number
): { d: string; loopCount: number; pointCount: number } {
  const cleaned = smoothness >= 2 ? despeckle(rawGrid, w, h) : rawGrid;
  const loops = traceContours(cleaned, w, h);
  const eps = 0.45 + smoothness * 0.22;
  const smoothIters = smoothness >= 6 ? 2 : smoothness >= 2 ? 1 : 0;
  const useCurves = smoothness >= 1;

  const parts: string[] = [];
  let pointCount = 0;
  for (const loop of loops) {
    if (polygonAreaAbs(loop) < minAreaPx) continue;
    let processed = simplifyClosedRDP(loop, eps);
    if (processed.length < 3) continue;
    if (smoothIters > 0) processed = chaikinSmoothClosed(processed, smoothIters);
    const sub = loopToSvgSubpath(processed, useCurves);
    if (sub) {
      parts.push(sub);
      pointCount += processed.length;
    }
  }
  return { d: parts.join(' '), loopCount: parts.length, pointCount };
}

/**
 * Pass-through for native uploaded .SVG files (keeps pure vectors, applies filament tint)
 */
export function prepareNativeSvg(
  svgText: string,
  fillColor: string,
  physicalWidthMm = 60
): VectorizeResult | null {
  try {
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    if (doc.getElementsByTagName('parsererror').length) return null;
    const root = doc.documentElement;
    if (!root || root.localName !== 'svg') return null;

    let vb = { x: 0, y: 0, w: 100, h: 100 };
    const vbAttr = root.getAttribute('viewBox');
    if (vbAttr) {
      const nums = vbAttr.trim().split(/[\s,]+/).map(Number);
      if (nums.length === 4 && nums.every(isFinite) && nums[2] > 0 && nums[3] > 0) {
        vb = { x: nums[0], y: nums[1], w: nums[2], h: nums[3] };
      }
    } else {
      const wAttr = parseFloat(root.getAttribute('width') || '');
      const hAttr = parseFloat(root.getAttribute('height') || '');
      if (isFinite(wAttr) && wAttr > 0 && isFinite(hAttr) && hAttr > 0) {
        vb = { x: 0, y: 0, w: wAttr, h: hAttr };
      }
    }

    const clone = root.cloneNode(true) as Element;
    clone.querySelectorAll('script,foreignObject,title,desc,metadata').forEach((el) => el.remove());
    clone.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      });
      const tag = el.localName.toLowerCase();
      if (['path', 'polygon', 'rect', 'circle', 'ellipse', 'polyline'].includes(tag)) {
        const curFill = el.getAttribute('fill');
        if (curFill !== 'none') el.setAttribute('fill', fillColor);
        const curStroke = el.getAttribute('stroke');
        if (curStroke && curStroke !== 'none') el.setAttribute('stroke', fillColor);
      }
    });

    const serializer = new XMLSerializer();
    const innerParts: string[] = [];
    for (let i = 0; i < clone.childNodes.length; i++) {
      const ch = clone.childNodes[i];
      if (ch.nodeType === 1) innerParts.push(serializer.serializeToString(ch));
    }
    if (!innerParts.length) return null;

    const innerMarkup = innerParts.join('');
    const aspect = vb.w / vb.h;
    const heightMm = physicalWidthMm / aspect;
    const svgString =
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${physicalWidthMm.toFixed(1)}mm" height="${heightMm.toFixed(1)}mm">` +
      `<g fill="${fillColor}">${innerMarkup}</g></svg>`;

    return {
      svgString,
      innerMarkup: `<g fill="${fillColor}">${innerMarkup}</g>`,
      viewBox: vb,
      aspect,
      pathCount: clone.querySelectorAll('path,polygon,rect,circle,ellipse').length || 1,
      pointCount: 0,
      autoThreshold: 128,
      previewDataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString),
      isNativeSvg: true,
    };
  } catch {
    return null;
  }
}

/**
 * Vectorize ANY bitmap image (PNG, JPG, WEBP, phone photo, screenshot) into a
 * clean, extrudable, slicer-ready SVG.
 */
export async function vectorizeImageToSvg(
  imageDataUrl: string,
  options: VectorizeOptions
): Promise<VectorizeResult> {
  const img = await loadImageElement(imageDataUrl);
  const natW = img.naturalWidth || 200;
  const natH = img.naturalHeight || 200;
  const aspect = natW / natH;

  // Working grid: high enough for crisp logos & faces, fast enough for real-time slider updates (<40ms)
  const maxDim = options.mode === 'stamp' ? 210 : 180;
  let w: number;
  let h: number;
  if (aspect >= 1) {
    w = maxDim;
    h = Math.max(24, Math.round(maxDim / aspect));
  } else {
    h = maxDim;
    w = Math.max(24, Math.round(maxDim * aspect));
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const imgData = ctx.getImageData(0, 0, w, h);
  const rgba = imgData.data;

  // Compute perceptual luminance & foreground eligibility mask
  const luma = new Uint8Array(w * h);
  const validMask = new Uint8Array(w * h);
  const bgInfo = estimateCornerBackground(rgba, w, h);
  const bgFlood =
    options.removeBackground && bgInfo.hasSolidBg && !bgInfo.hasAlpha
      ? buildBackgroundMask(rgba, w, h, bgInfo.r, bgInfo.g, bgInfo.b, 48)
      : null;

  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const a = rgba[idx + 3];
    const yVal = Math.round(0.299 * rgba[idx] + 0.587 * rgba[idx + 1] + 0.114 * rgba[idx + 2]);
    luma[i] = yVal;
    const isTransparent = a < 110;
    const isRemovedBg = bgFlood ? bgFlood[i] === 1 : false;
    validMask[i] = isTransparent || isRemovedBg ? 0 : 1;
  }

  // If background removal cleared almost everything, relax and keep all opaque pixels
  let validCount = 0;
  for (let i = 0; i < validMask.length; i++) validCount += validMask[i];
  if (validCount < w * h * 0.015) {
    for (let i = 0; i < w * h; i++) {
      validMask[i] = rgba[i * 4 + 3] >= 90 ? 1 : 0;
    }
  }

  const autoThreshold = computeOtsuThreshold(luma, validMask);
  const thresh = typeof options.threshold === 'number' ? options.threshold : autoThreshold;
  const minAreaPx = Math.max(4, Math.round((w * h) * 0.00022));
  const physicalW = options.physicalWidthMm || 60;
  const physicalH = physicalW / aspect;

  let innerMarkup = '';
  let pathCount = 0;
  let pointCount = 0;

  if (options.mode === 'logo') {
    // Crisp single-color print silhouette
    const grid = new Uint8Array(w * h);
    const bgIsDark = bgInfo.hasSolidBg && (0.299 * bgInfo.r + 0.587 * bgInfo.g + 0.114 * bgInfo.b) < 115;

    for (let i = 0; i < w * h; i++) {
      if (!validMask[i]) {
        grid[i] = 0;
        continue;
      }
      if (bgInfo.hasAlpha && options.removeBackground) {
        // Transparent PNG logo: keep opaque artwork (modulated by threshold when adjusted)
        grid[i] = options.invert ? (luma[i] > thresh ? 1 : 0) : (rgba[i * 4 + 3] >= 120 ? 1 : 0);
      } else if (bgIsDark) {
        // Light logo on dark background -> foreground is brighter than threshold
        const fg = luma[i] >= thresh ? 1 : 0;
        grid[i] = options.invert ? 1 - fg : fg;
      } else {
        // Dark logo on light background -> foreground is darker than threshold
        const fg = luma[i] <= thresh ? 1 : 0;
        grid[i] = options.invert ? 1 - fg : fg;
      }
    }

    const traced = traceBinaryGridToPathD(grid, w, h, options.smoothness, minAreaPx);
    if (traced.d) {
      innerMarkup = `<path d="${traced.d}" fill="${options.fillColor}" fill-rule="evenodd"/>`;
      pathCount = traced.loopCount;
      pointCount = traced.pointCount;
    }
  } else if (options.mode === 'photo') {
    // 2-Tone Sculpted Relief (Midtone Silhouette + Deep Shadow Detail Layer)
    const darkGrid = new Uint8Array(w * h);
    const midGrid = new Uint8Array(w * h);
    const darkThresh = Math.max(20, Math.round(thresh * 0.72));
    const midThresh = Math.min(238, Math.round(thresh * 1.18));

    for (let i = 0; i < w * h; i++) {
      if (!validMask[i]) continue;
      const v = options.invert ? 255 - luma[i] : luma[i];
      if (v <= midThresh) midGrid[i] = 1;
      if (v <= darkThresh) darkGrid[i] = 1;
    }

    const midTraced = traceBinaryGridToPathD(midGrid, w, h, options.smoothness, minAreaPx * 1.2);
    const darkTraced = traceBinaryGridToPathD(darkGrid, w, h, Math.max(1, options.smoothness - 1), minAreaPx);

    const midColor = options.secondaryColor || options.fillColor;
    const parts: string[] = [];
    if (midTraced.d) {
      parts.push(`<path d="${midTraced.d}" fill="${midColor}" fill-opacity="0.48" fill-rule="evenodd"/>`);
      pathCount += midTraced.loopCount;
      pointCount += midTraced.pointCount;
    }
    if (darkTraced.d) {
      parts.push(`<path d="${darkTraced.d}" fill="${options.fillColor}" fill-rule="evenodd"/>`);
      pathCount += darkTraced.loopCount;
      pointCount += darkTraced.pointCount;
    }
    innerMarkup = parts.join('');
  } else {
    // 'stamp': Local adaptive contrast + Sobel edge enhancement for clean engraved stamps
    const grid = new Uint8Array(w * h);
    const edgeStrength = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (!validMask[i]) continue;
        const gx =
          -luma[(y - 1) * w + (x - 1)] + luma[(y - 1) * w + (x + 1)]
          - 2 * luma[y * w + (x - 1)] + 2 * luma[y * w + (x + 1)]
          - luma[(y + 1) * w + (x - 1)] + luma[(y + 1) * w + (x + 1)];
        const gy =
          -luma[(y - 1) * w + (x - 1)] - 2 * luma[(y - 1) * w + x] - luma[(y - 1) * w + (x + 1)]
          + luma[(y + 1) * w + (x - 1)] + 2 * luma[(y + 1) * w + x] + luma[(y + 1) * w + (x + 1)];
        edgeStrength[i] = Math.min(255, Math.round(Math.hypot(gx, gy) * 0.35));
      }
    }
    const edgeCutoff = Math.max(24, Math.round(145 - (thresh - 128) * 0.7));
    const darkCutoff = Math.max(20, Math.round(thresh * 0.62));
    for (let i = 0; i < w * h; i++) {
      if (!validMask[i]) continue;
      const v = options.invert ? 255 - luma[i] : luma[i];
      grid[i] = edgeStrength[i] >= edgeCutoff || v <= darkCutoff ? 1 : 0;
    }

    const traced = traceBinaryGridToPathD(grid, w, h, Math.max(1, options.smoothness), minAreaPx);
    if (traced.d) {
      innerMarkup = `<path d="${traced.d}" fill="${options.fillColor}" fill-rule="evenodd"/>`;
      pathCount = traced.loopCount;
      pointCount = traced.pointCount;
    }
  }

  // Fallback: if threshold produced zero shapes, retry gently with Otsu 50%
  if (!innerMarkup) {
    const fallbackGrid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (validMask[i] && luma[i] < 160) fallbackGrid[i] = 1;
    }
    const fb = traceBinaryGridToPathD(fallbackGrid, w, h, 2, 3);
    if (fb.d) {
      innerMarkup = `<path d="${fb.d}" fill="${options.fillColor}" fill-rule="evenodd"/>`;
      pathCount = fb.loopCount;
      pointCount = fb.pointCount;
    }
  }

  const svgString =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${w} ${h}" width="${physicalW.toFixed(1)}mm" height="${physicalH.toFixed(1)}mm">` +
    `${innerMarkup}</svg>`;

  return {
    svgString,
    innerMarkup,
    viewBox: { x: 0, y: 0, w, h },
    aspect,
    pathCount,
    pointCount,
    autoThreshold,
    previewDataUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString),
  };
}
