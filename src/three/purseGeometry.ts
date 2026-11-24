import * as THREE from 'three';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import {
  FINISH_OPTIONS,
  HARDWARE_OPTIONS,
  PURSE_SIZES,
  PURSE_TEXTURES,
} from '../config/storefrontConfig';
import type { PurseConfig, PurseShapeId, PurseTextureId } from '../types/store';

function regularPolyR(theta: number, sides: number, roundness = 0.14): number {
  const slice = (Math.PI * 2) / sides;
  const a = (((theta % slice) + slice) % slice) - slice * 0.5;
  const polyR = Math.cos(slice * 0.5) / Math.cos(a);
  return (1 - roundness) * polyR + roundness;
}

export function getSilhouettePoint(
  u: number,
  shape: PurseShapeId,
  width: number,
  depth: number
): { x: number; z: number } {
  const theta = u * Math.PI * 2;
  const hw = width * 0.5;
  const hd = depth * 0.5;
  let x = 0;
  let z = 0;

  switch (shape) {
    case 'heart': {
      const hx = Math.pow(Math.sin(theta), 3);
      const hz =
        (13 * Math.cos(theta) -
          5 * Math.cos(2 * theta) -
          2 * Math.cos(3 * theta) -
          Math.cos(4 * theta)) /
        16;
      x = hw * hx;
      z = -hd * (hz - 0.14);
      break;
    }
    case 'star5': {
      const sf = 0.7 + 0.3 * Math.cos(theta * 5 - Math.PI / 2);
      x = hw * Math.cos(theta) * sf;
      z = hd * Math.sin(theta) * sf;
      break;
    }
    case 'tote': {
      const n = 3.6;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      x = hw * Math.sign(cosT) * Math.pow(Math.abs(cosT), 2 / n);
      z = hd * Math.sign(sinT) * Math.pow(Math.abs(sinT), 2 / n);
      break;
    }
    case 'octagon': {
      const r = regularPolyR(theta + Math.PI / 8, 8, 0.13);
      x = hw * Math.cos(theta) * r;
      z = hd * Math.sin(theta) * r;
      break;
    }
    case 'crescent': {
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const arch = 0.32 * Math.cos(cosT * Math.PI * 0.5);
      x = hw * cosT;
      z = hd * (sinT * 0.76 - arch + 0.16);
      break;
    }
    case 'diamond': {
      const denom =
        Math.pow(Math.abs(Math.cos(theta)), 1.25) +
        Math.pow(Math.abs(Math.sin(theta)), 1.25);
      x = (hw / denom) * Math.cos(theta);
      z = (hd / denom) * Math.sin(theta);
      break;
    }
    case 'scallop': {
      const wave = 0.87 + 0.13 * Math.abs(Math.cos(theta * 4));
      x = hw * Math.cos(theta) * wave;
      z = hd * Math.sin(theta) * wave;
      break;
    }
    default: {
      x = hw * Math.cos(theta);
      z = hd * Math.sin(theta);
    }
  }
  return { x, z };
}

function getSurfaceTextureOffset(
  u: number,
  v: number,
  textureId: PurseTextureId,
  depthMm: number
): number {
  if (textureId === 'smooth' || depthMm <= 0) return 0;
  const freqU = 16;
  const freqV = 8;
  const fade =
    Math.sin(Math.min(1, v * 6) * Math.PI * 0.5) *
    Math.sin(Math.min(1, (1 - v) * 6) * Math.PI * 0.5);
  let val = 0;

  if (textureId === 'quilt') {
    const d1 = Math.abs(Math.sin((u * freqU + v * freqV) * Math.PI));
    const d2 = Math.abs(Math.sin((u * freqU - v * freqV) * Math.PI));
    val = Math.pow(d1 * d2, 0.45) * depthMm;
  } else if (textureId === 'chevron') {
    const vWave = Math.abs(((u * 2) % 1) - 0.5) * 2;
    val = (Math.sin((v * freqV * 1.4 + vWave * 2.4) * Math.PI * 2) * 0.5 + 0.5) * depthMm;
  } else if (textureId === 'woven') {
    const wu = Math.sin(u * freqU * Math.PI * 2);
    const wv = Math.sin(v * freqV * Math.PI * 2);
    const checker = Math.sign(
      Math.sin(u * freqU * Math.PI) * Math.sin(v * freqV * Math.PI)
    );
    val = (checker > 0 ? Math.abs(wu) : Math.abs(wv)) * 0.85 * depthMm;
  } else if (textureId === 'pleats') {
    val = Math.abs(Math.sin(u * freqU * 1.5 * Math.PI)) * depthMm;
  }
  return val * fade;
}

export function getResolvedDimensions(cfg: PurseConfig) {
  const sz = PURSE_SIZES.find((s) => s.id === cfg.size) ?? PURSE_SIZES[1];
  const tx = PURSE_TEXTURES.find((t) => t.id === cfg.texture) ?? PURSE_TEXTURES[0];
  return {
    width: sz.width,
    height: sz.height,
    depth: sz.depth,
    lidHeight: sz.lidHeight,
    texDepth: tx.depth,
  };
}

function getOffsetPoint(
  u: number,
  shape: PurseShapeId,
  width: number,
  depth: number,
  radialOffset = 0,
  scaleFactor = 1.0
) {
  const base = getSilhouettePoint(u, shape, width, depth);
  let x = base.x * scaleFactor;
  let z = base.z * scaleFactor;
  const len = Math.sqrt(x * x + z * z) || 1;
  x += (x / len) * radialOffset;
  z += (z / len) * radialOffset;
  return { x, z };
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

function createGradientTexture(
  primaryHex: string,
  secondaryHex: string,
  mode: 'ombre' | 'dual-silk' | 'tri-color',
  maxAnisotropy: number,
  tertiaryHex = '#F4F7FA'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (mode === 'ombre') {
    const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
    grad.addColorStop(0, primaryHex);
    grad.addColorStop(0.52, primaryHex);
    grad.addColorStop(1, secondaryHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (mode === 'tri-color') {
    // Sculpted 3-color vertical atelier transition (Base -> Mid -> Upper Accent)
    const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
    grad.addColorStop(0, primaryHex);
    grad.addColorStop(0.32, primaryHex);
    grad.addColorStop(0.62, secondaryHex);
    grad.addColorStop(0.92, tertiaryHex);
    grad.addColorStop(1, tertiaryHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Dual-silk horizontal multi-filament sheen wrap
    const grad = ctx.createLinearGradient(0, 0, canvas.width, 0);
    grad.addColorStop(0, primaryHex);
    grad.addColorStop(0.28, secondaryHex);
    grad.addColorStop(0.55, primaryHex);
    grad.addColorStop(0.82, secondaryHex);
    grad.addColorStop(1, primaryHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle micro-layer silk shimmer horizontal lines
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = 0; y < canvas.height; y += 6) {
      ctx.fillRect(0, y, canvas.width, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = Math.max(1, Math.min(8, maxAnisotropy));
  tex.needsUpdate = true;
  return tex;
}

function createMonogramTexture(
  text: string,
  hardwareHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  const dark = isDarkHex(hardwareHex);
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (dark) {
    grad.addColorStop(0, '#1E2733');
    grad.addColorStop(1, '#0B1117');
  } else {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#DCE4EC');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = dark ? 'rgba(0, 156, 166, 0.72)' : 'rgba(11, 17, 23, 0.35)';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  const letters = (text || '').trim().toUpperCase().slice(0, 4);
  if (letters) {
    ctx.font = '700 132px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = dark ? '#F8FAFC' : '#0B1117';
    ctx.fillText(letters, canvas.width / 2, canvas.height / 2 + 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.max(1, Math.min(8, maxAnisotropy));
  tex.needsUpdate = true;
  return tex;
}

export interface PurseMaterialSet {
  bodyMat: THREE.MeshPhysicalMaterial;
  lidMat: THREE.MeshPhysicalMaterial;
  hardwareMat: THREE.MeshPhysicalMaterial;
  textures: THREE.Texture[];
}

export function createPurseMaterials(
  cfg: PurseConfig,
  maxAnisotropy = 4
): PurseMaterialSet {
  const finishSpec = FINISH_OPTIONS.find((f) => f.id === cfg.finish) ?? FINISH_OPTIONS[0];
  const hwSpec =
    HARDWARE_OPTIONS.find((h) => h.id === cfg.hardwareFinish) ?? HARDWARE_OPTIONS[0];

  const textures: THREE.Texture[] = [];
  let bodyMap: THREE.CanvasTexture | null = null;
  let lidMap: THREE.CanvasTexture | null = null;
  const thirdHex = cfg.tertiaryHex || '#F4F7FA';

  if (
    cfg.colorMode === 'ombre' ||
    cfg.colorMode === 'dual-silk' ||
    cfg.colorMode === 'tri-color'
  ) {
    bodyMap = createGradientTexture(
      cfg.primaryHex,
      cfg.secondaryHex,
      cfg.colorMode,
      maxAnisotropy,
      thirdHex
    );
    textures.push(bodyMap);
    lidMap = cfg.colorMode === 'dual-silk' ? bodyMap : null;
  }

  const isDualSilk = cfg.colorMode === 'dual-silk';

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyMap ? new THREE.Color('#FFFFFF') : new THREE.Color(cfg.primaryHex),
    map: bodyMap,
    roughness: finishSpec.roughness,
    metalness: isDualSilk ? Math.max(0.35, finishSpec.metalness) : finishSpec.metalness,
    clearcoat: finishSpec.clearcoat,
    clearcoatRoughness: 0.18,
    iridescence: isDualSilk ? 0.85 : cfg.finish === 'pearl' ? 0.35 : 0,
    iridescenceIOR: 1.35,
    sheen: isDualSilk ? 0.75 : 0.15,
    sheenColor: new THREE.Color(cfg.secondaryHex),
    side: THREE.DoubleSide,
  });

  const lidColorHex =
    cfg.colorMode === 'tri-color'
      ? thirdHex
      : cfg.colorMode === 'two-tone' || cfg.colorMode === 'ombre'
        ? cfg.secondaryHex
        : cfg.primaryHex;

  const lidMat = new THREE.MeshPhysicalMaterial({
    color: lidMap ? new THREE.Color('#FFFFFF') : new THREE.Color(lidColorHex),
    map: lidMap,
    roughness: Math.max(0.12, finishSpec.roughness - 0.04),
    metalness: isDualSilk ? Math.max(0.35, finishSpec.metalness) : finishSpec.metalness,
    clearcoat: finishSpec.clearcoat,
    clearcoatRoughness: 0.15,
    iridescence: isDualSilk ? 0.85 : cfg.finish === 'pearl' ? 0.35 : 0,
    sheen: isDualSilk ? 0.75 : 0.15,
    sheenColor: new THREE.Color(cfg.primaryHex),
    side: THREE.DoubleSide,
  });

  const resolvedHwHex =
    cfg.hardwareFinish === 'matched'
      ? cfg.colorMode === 'tri-color'
        ? thirdHex
        : cfg.secondaryHex
      : hwSpec.hex;

  const hardwareMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(resolvedHwHex),
    metalness: hwSpec.metalness,
    roughness: hwSpec.roughness,
    clearcoat: 0.4,
    side: THREE.DoubleSide,
  });

  return { bodyMat, lidMat, hardwareMat, textures };
}

export function createPurseBodyGroup(
  cfg: PurseConfig,
  materials: PurseMaterialSet,
  maxAnisotropy = 4
): THREE.Group {
  const group = new THREE.Group();
  const dims = getResolvedDimensions(cfg);
  const segU = 128;
  const segV = 44;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const addV = (x: number, y: number, z: number, uCoord: number, vCoord: number) => {
    positions.push(x, y, z);
    uvs.push(uCoord, vCoord);
    return positions.length / 3 - 1;
  };

  const wall = 3.2;
  const floorT = 3.8;
  const outerGrid: number[][] = [];
  const innerGrid: number[][] = [];

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    const yOut = v * dims.height;
    const yIn = floorT + v * (dims.height - floorT);
    const baseRound = 1.0 - 0.04 * Math.pow(1 - v, 3);
    const rOut: number[] = [];
    const rIn: number[] = [];

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      const uWrap = iu === segU ? 0 : u;
      const tex = getSurfaceTextureOffset(uWrap, v, cfg.texture, dims.texDepth);
      const pOut = getOffsetPoint(uWrap, cfg.shape, dims.width, dims.depth, tex, baseRound);
      const pIn = getOffsetPoint(uWrap, cfg.shape, dims.width, dims.depth, -wall, baseRound);
      rOut.push(addV(pOut.x, yOut, pOut.z, u, v));
      rIn.push(addV(pIn.x, yIn, pIn.z, u, v));
    }
    outerGrid.push(rOut);
    innerGrid.push(rIn);
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const nU = iu + 1;
      indices.push(outerGrid[iv][iu], outerGrid[iv + 1][nU], outerGrid[iv][nU]);
      indices.push(outerGrid[iv][iu], outerGrid[iv + 1][iu], outerGrid[iv + 1][nU]);

      indices.push(innerGrid[iv][iu], innerGrid[iv][nU], innerGrid[iv + 1][nU]);
      indices.push(innerGrid[iv][iu], innerGrid[iv + 1][nU], innerGrid[iv + 1][iu]);
    }
  }

  for (let iu = 0; iu < segU; iu++) {
    const nU = iu + 1;
    indices.push(outerGrid[segV][iu], outerGrid[segV][nU], innerGrid[segV][nU]);
    indices.push(outerGrid[segV][iu], innerGrid[segV][nU], innerGrid[segV][iu]);
  }

  const outC = addV(0, 0, 0, 0.5, 0);
  const inC = addV(0, floorT, 0, 0.5, 0.1);
  for (let iu = 0; iu < segU; iu++) {
    const nU = iu + 1;
    indices.push(outC, outerGrid[0][nU], outerGrid[0][iu]);
    indices.push(inC, innerGrid[0][iu], innerGrid[0][nU]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const bodyMesh = new THREE.Mesh(geo, materials.bodyMat);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  const backPt = getOffsetPoint(0.75, cfg.shape, dims.width, dims.depth, 0, 1.0);
  const frontPt = getOffsetPoint(0.25, cfg.shape, dims.width, dims.depth, 0, 1.0);

  // Rear Hinged Knuckles
  const hZ = backPt.z - 4.2;
  const span = Math.min(34, dims.width * 0.24);
  [-span * 0.65, span * 0.65].forEach((xPos) => {
    const knuck = new THREE.CylinderGeometry(4.6, 4.6, span * 0.44, 24);
    knuck.rotateZ(Math.PI / 2);
    knuck.translate(xPos, dims.height, hZ);
    group.add(new THREE.Mesh(knuck, materials.bodyMat));
  });
  const pin = new THREE.CylinderGeometry(2.1, 2.1, span * 1.65, 20);
  pin.rotateZ(Math.PI / 2);
  pin.translate(0, dims.height, hZ);
  group.add(new THREE.Mesh(pin, materials.hardwareMat));

  // Front Clasp Hardware
  if (cfg.clasp === 'snap') {
    const stud = new THREE.BoxGeometry(18, 6, 4.2);
    stud.translate(0, dims.height - 5, frontPt.z + 2.0);
    group.add(new THREE.Mesh(stud, materials.hardwareMat));
  } else {
    [-18, 18].forEach((mx) => {
      const pad = new THREE.CylinderGeometry(4, 4, 2.2, 18);
      pad.translate(mx, dims.height - 1.2, frontPt.z - 4.5);
      group.add(new THREE.Mesh(pad, materials.hardwareMat));
    });
  }

  // Crossbody D-Rings
  if (cfg.handle === 'side_loops' || cfg.handle === 'both') {
    const rightPt = getOffsetPoint(0.0, cfg.shape, dims.width, dims.depth, 0, 1.0);
    const leftPt = getOffsetPoint(0.5, cfg.shape, dims.width, dims.depth, 0, 1.0);
    [rightPt.x + 2, leftPt.x - 2].forEach((xPos) => {
      const loop = new THREE.TorusGeometry(8.5, 2.8, 14, 28);
      loop.rotateY(Math.PI / 2);
      loop.translate(xPos, dims.height * 0.84, 0);
      group.add(new THREE.Mesh(loop, materials.hardwareMat));
    });
  }

  // Front Center Medallion Plaque + Monogram
  if (cfg.badge !== 'none') {
    const fMid = getOffsetPoint(0.25, cfg.shape, dims.width, dims.depth, dims.texDepth, 1.0);
    const bDepth = 4.6;
    let bGeo: THREE.BufferGeometry | null = null;

    if (cfg.badge === 'circle') {
      bGeo = new THREE.CylinderGeometry(18, 19.2, bDepth, 40);
      bGeo.rotateX(Math.PI / 2);
    } else if (cfg.badge === 'plaque') {
      bGeo = new THREE.BoxGeometry(44, 24, bDepth);
    } else if (cfg.badge === 'diamond') {
      bGeo = new THREE.BoxGeometry(26, 26, bDepth);
      bGeo.rotateZ(Math.PI / 4);
    } else if (cfg.badge === 'shield') {
      const s = new THREE.Shape();
      s.moveTo(0, 20);
      s.lineTo(17, 14);
      s.quadraticCurveTo(17, -8, 0, -21);
      s.quadraticCurveTo(-17, -8, -17, 14);
      s.closePath();
      bGeo = new THREE.ExtrudeGeometry(s, {
        depth: bDepth,
        bevelEnabled: true,
        bevelThickness: 1.1,
        bevelSize: 0.9,
        bevelSegments: 2,
      });
      bGeo.translate(0, 0, -bDepth * 0.5);
    }

    if (bGeo) {
      bGeo.translate(0, dims.height * 0.52, fMid.z + 1.8);
      group.add(new THREE.Mesh(bGeo, materials.hardwareMat));

      if (cfg.monogram && cfg.monogram.trim().length > 0) {
        const hwColorHex = `#${materials.hardwareMat.color.getHexString()}`;
        const monoTex = createMonogramTexture(cfg.monogram, hwColorHex, maxAnisotropy);
        materials.textures.push(monoTex);
        const monoMat = new THREE.MeshStandardMaterial({
          map: monoTex,
          roughness: 0.28,
          metalness: 0.2,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        const wPlaque = cfg.badge === 'plaque' ? 36 : 26;
        const hPlaque = cfg.badge === 'plaque' ? 18 : 16;
        const monoPlate = new THREE.BoxGeometry(wPlaque, hPlaque, 1.2);
        monoPlate.translate(0, dims.height * 0.52, fMid.z + 1.8 + bDepth * 0.5 + 0.65);
        group.add(new THREE.Mesh(monoPlate, monoMat));
      }
    }
  }

  return group;
}

export function createPurseLidGroup(
  cfg: PurseConfig,
  materials: PurseMaterialSet
): THREE.Group {
  const lidGroup = new THREE.Group();
  const dims = getResolvedDimensions(cfg);
  const segU = 128;
  const segV = 20;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const addV = (x: number, y: number, z: number, uCoord: number, vCoord: number) => {
    positions.push(x, y, z);
    uvs.push(uCoord, vCoord);
    return positions.length / 3 - 1;
  };

  const wall = 3.2;
  const roofT = 3.2;
  const outerGrid: number[][] = [];
  const innerGrid: number[][] = [];

  for (let iv = 0; iv <= segV; iv++) {
    const v = iv / segV;
    const yOut = v * dims.lidHeight;
    const yIn = v * (dims.lidHeight - roofT);
    const crownScale = 1.0 - 0.08 * Math.pow(v, 2);
    const rOut: number[] = [];
    const rIn: number[] = [];

    for (let iu = 0; iu <= segU; iu++) {
      const u = iu / segU;
      const uWrap = iu === segU ? 0 : u;
      const tex =
        getSurfaceTextureOffset(uWrap, v, cfg.texture, dims.texDepth) * (1 - v * 0.72);
      const pOut = getOffsetPoint(uWrap, cfg.shape, dims.width, dims.depth, tex, crownScale);
      const pIn = getOffsetPoint(uWrap, cfg.shape, dims.width, dims.depth, -wall, crownScale);
      rOut.push(addV(pOut.x, yOut, pOut.z, u, v));
      rIn.push(addV(pIn.x, yIn, pIn.z, u, v));
    }
    outerGrid.push(rOut);
    innerGrid.push(rIn);
  }

  for (let iv = 0; iv < segV; iv++) {
    for (let iu = 0; iu < segU; iu++) {
      const nU = iu + 1;
      indices.push(outerGrid[iv][iu], outerGrid[iv + 1][nU], outerGrid[iv][nU]);
      indices.push(outerGrid[iv][iu], outerGrid[iv + 1][iu], outerGrid[iv + 1][nU]);

      indices.push(innerGrid[iv][iu], innerGrid[iv][nU], innerGrid[iv + 1][nU]);
      indices.push(innerGrid[iv][iu], innerGrid[iv + 1][nU], innerGrid[iv + 1][iu]);
    }
  }

  const outRoof = addV(0, dims.lidHeight, 0, 0.5, 1);
  const inRoof = addV(0, dims.lidHeight - roofT, 0, 0.5, 1);
  for (let iu = 0; iu < segU; iu++) {
    const nU = iu + 1;
    indices.push(outRoof, outerGrid[segV][iu], outerGrid[segV][nU]);
    indices.push(inRoof, innerGrid[segV][nU], innerGrid[segV][iu]);
    indices.push(outerGrid[0][iu], innerGrid[0][nU], outerGrid[0][nU]);
    indices.push(outerGrid[0][iu], innerGrid[0][iu], innerGrid[0][nU]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const lidMesh = new THREE.Mesh(geo, materials.lidMat);
  lidMesh.castShadow = true;
  lidGroup.add(lidMesh);

  const backPt = getOffsetPoint(0.75, cfg.shape, dims.width, dims.depth, 0, 1.0);
  const frontPt = getOffsetPoint(0.25, cfg.shape, dims.width, dims.depth, 0, 1.0);

  // Rear Hinge Knuckle
  const hZ = backPt.z - 4.2;
  const span = Math.min(34, dims.width * 0.24);
  const midKnuck = new THREE.CylinderGeometry(4.3, 4.3, span * 0.7, 24);
  midKnuck.rotateZ(Math.PI / 2);
  midKnuck.translate(0, 0, hZ);
  lidGroup.add(new THREE.Mesh(midKnuck, materials.lidMat));

  // Front Clasp Tab
  if (cfg.clasp === 'snap') {
    const claspArm = new THREE.BoxGeometry(20, 13, 3.6);
    claspArm.translate(0, -3.5, frontPt.z + 3.2);
    lidGroup.add(new THREE.Mesh(claspArm, materials.hardwareMat));
  }

  // Sculpted Top Arch Handle
  if (cfg.handle === 'lid_arch' || cfg.handle === 'both') {
    const archR = Math.min(36, dims.width * 0.23);
    const handleGeo = new THREE.TorusGeometry(archR, 4.2, 16, 40, Math.PI);
    handleGeo.translate(0, dims.lidHeight - 1, 0);
    const handleMesh = new THREE.Mesh(handleGeo, materials.lidMat);
    handleMesh.castShadow = true;
    lidGroup.add(handleMesh);
  }

  return lidGroup;
}

export function disposeObject3D(group: THREE.Object3D) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
  });
  while (group.children.length > 0) {
    group.remove(group.children[0]);
  }
}

export function exportPurseToSTL(
  cfg: PurseConfig,
  part: 'full' | 'body' | 'lid'
): string {
  const exporter = new STLExporter();
  const mats = createPurseMaterials(cfg, 1);
  const dims = getResolvedDimensions(cfg);
  const exportRoot = new THREE.Group();

  if (part === 'body' || part === 'full') {
    exportRoot.add(createPurseBodyGroup(cfg, mats, 1));
  }
  if (part === 'lid' || part === 'full') {
    const lid = createPurseLidGroup(cfg, mats);
    if (part === 'lid') {
      lid.rotation.x = Math.PI;
      lid.position.set(0, dims.lidHeight, 0);
    } else {
      const backPt = getOffsetPoint(0.75, cfg.shape, dims.width, dims.depth, 0, 1.0);
      const hingeZ = backPt.z - 4.2;
      const pivot = new THREE.Group();
      pivot.position.set(0, dims.height, hingeZ);
      lid.position.set(0, 0, -hingeZ);
      pivot.rotation.x = -(cfg.lidAngle * Math.PI) / 180;
      pivot.add(lid);
      exportRoot.add(pivot);
    }
    if (part === 'lid') {
      exportRoot.add(lid);
    }
  }

  exportRoot.updateMatrixWorld(true);
  const data = exporter.parse(exportRoot, { binary: true }) as DataView;
  const filename = `maison704_${cfg.shape}_${part}.stl`;
  const arrayBuffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(arrayBuffer).set(
    new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  );
  const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  disposeObject3D(exportRoot);
  mats.textures.forEach((t) => t.dispose());
  return filename;
}
