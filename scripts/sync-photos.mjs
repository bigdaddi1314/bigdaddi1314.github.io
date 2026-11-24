#!/usr/bin/env node
/**
 * Maison 704 — 1-Command Incremental Product Photo Sync
 * -----------------------------------------------------
 * Usage:
 *   npm run sync-photos
 *   node scripts/sync-photos.mjs --no-build   (skip `npm run build`)
 *
 * Scans:
 *   - public/images/gallery/   (any .webp/.jpg/.jpeg/.png is treated as a real photo)
 *   - public/images/products/  (.webp/.jpg/.jpeg, *-real.png/*-photo.png, or any .png
 *                               whose SHA-256 differs from starter-render-hashes.json)
 *
 * Automatically matches files by SKU / product ID / slug / gallery slot ID,
 * updates `realPhotoUrl` in src/components/MadeInAtelierGallery.tsx,
 * updates `image` & `photoStatus` in public/products-catalog.json & .js,
 * runs `npm run build`, and prints a clear progress summary.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const GALLERY_DIR = path.join(ROOT, 'public', 'images', 'gallery');
const PRODUCTS_DIR = path.join(ROOT, 'public', 'images', 'products');
const CATALOG_JSON_PATH = path.join(ROOT, 'public', 'products-catalog.json');
const CATALOG_JS_PATH = path.join(ROOT, 'public', 'products-catalog.js');
const GALLERY_TSX_PATH = path.join(ROOT, 'src', 'components', 'MadeInAtelierGallery.tsx');
const HASH_MANIFEST_PATH = path.join(ROOT, 'scripts', 'starter-render-hashes.json');

const IMAGE_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png']);
const EXT_RANK = { '.webp': 3, '.jpg': 2, '.jpeg': 2, '.png': 1 };

const skipBuild = process.argv.includes('--no-build');

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function normalizeSlug(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/(?:[-_\s](?:real|photo|studio|final|edited|bg|cutout))+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactKey(raw) {
  return normalizeSlug(raw).replace(/-/g, '');
}

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXTS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''));
}

function loadOrCreateStarterHashes(catalog) {
  if (fs.existsSync(HASH_MANIFEST_PATH)) {
    try {
      return readJsonFile(HASH_MANIFEST_PATH);
    } catch {
      // Regenerate below if corrupted
    }
  }

  const hashes = {};
  const statusByFile = new Map();
  for (const p of catalog.products || []) {
    if (p.image && p.image.startsWith('images/products/')) {
      statusByFile.set(path.basename(p.image), p.photoStatus || 'studio-preview');
    }
  }

  for (const fileName of listImages(PRODUCTS_DIR)) {
    const ext = path.extname(fileName).toLowerCase();
    if (ext !== '.png') continue;
    if (/(?:[-_](?:real|photo))\.png$/i.test(fileName)) continue;
    if (statusByFile.get(fileName) === 'real-photo') continue;
    hashes[fileName] = sha256File(path.join(PRODUCTS_DIR, fileName));
  }

  fs.mkdirSync(path.dirname(HASH_MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(HASH_MANIFEST_PATH, JSON.stringify(hashes, null, 2) + '\n', 'utf-8');
  return hashes;
}

function collectPhotoCandidates(starterHashes) {
  const candidates = [];

  // 1. public/images/gallery/ — every image here is treated as a real photo (highest priority)
  for (const fileName of listImages(GALLERY_DIR)) {
    const ext = path.extname(fileName).toLowerCase();
    candidates.push({
      source: 'gallery',
      fileName,
      relPath: `images/gallery/${fileName}`,
      publicUrl: `/images/gallery/${fileName}`,
      ext,
      slug: normalizeSlug(fileName),
      compact: compactKey(fileName),
      isReal: true,
      priority: 100 + (EXT_RANK[ext] || 0),
    });
  }

  // 2. public/images/products/ — detect real photos vs. starter 3D renders
  for (const fileName of listImages(PRODUCTS_DIR)) {
    const ext = path.extname(fileName).toLowerCase();
    const fullPath = path.join(PRODUCTS_DIR, fileName);
    const hasRealSuffix = /(?:[-_](?:real|photo))\.png$/i.test(fileName);

    let isReal = false;
    if (ext === '.webp' || ext === '.jpg' || ext === '.jpeg') {
      isReal = true;
    } else if (hasRealSuffix) {
      isReal = true;
    } else if (ext === '.png') {
      const baselineHash = starterHashes[fileName];
      if (!baselineHash) {
        // Newly added .png not in starter render manifest
        isReal = true;
      } else {
        const currentHash = sha256File(fullPath);
        if (currentHash !== baselineHash) {
          isReal = true;
        }
      }
    }

    const priority = isReal
      ? (ext === '.png' ? (hasRealSuffix ? 60 : 50) : 70 + (EXT_RANK[ext] || 0))
      : 10;

    candidates.push({
      source: 'products',
      fileName,
      relPath: `images/products/${fileName}`,
      publicUrl: `/images/products/${fileName}`,
      ext,
      slug: normalizeSlug(fileName),
      compact: compactKey(fileName),
      isReal,
      priority,
    });
  }

  return candidates;
}

function pickBestCandidate(keys, candidates, { realOnly = false } = {}) {
  const slugSet = new Set(keys.map(normalizeSlug).filter(Boolean));
  const compactSet = new Set(keys.map(compactKey).filter(Boolean));

  const matches = candidates.filter((c) => {
    if (realOnly && !c.isReal) return false;
    return slugSet.has(c.slug) || compactSet.has(c.compact);
  });

  if (matches.length === 0) return null;
  matches.sort((a, b) => b.priority - a.priority || a.fileName.localeCompare(b.fileName));
  return matches[0];
}

function updateMadeInAtelierGallery(candidates, matchedGalleryFiles) {
  let tsx = fs.readFileSync(GALLERY_TSX_PATH, 'utf-8');
  const startMarker = 'export const ATELIER_SHOWCASE_PHOTOS: ShowcasePhotoSlot[] = [';
  const startIdx = tsx.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error('Could not find ATELIER_SHOWCASE_PHOTOS in src/components/MadeInAtelierGallery.tsx');
  }
  const endIdx = tsx.indexOf('\n];', startIdx);
  if (endIdx === -1) {
    throw new Error('Could not find closing `];` for ATELIER_SHOWCASE_PHOTOS');
  }

  const arrayBlock = tsx.slice(startIdx, endIdx);
  const slotResults = [];
  let changed = false;

  const updatedArrayBlock = arrayBlock.replace(/\{\s*\n[\s\S]*?\n\s*\},/g, (slotBlock) => {
    const idMatch = slotBlock.match(/id:\s*'([^']+)'/);
    const codeMatch = slotBlock.match(/slotCode:\s*'([^']+)'/);
    const titleMatch = slotBlock.match(/title:\s*'([^']+)'/);
    const prodMatch = slotBlock.match(/productIdMatch:\s*'([^']+)'/);
    if (!idMatch || !prodMatch) return slotBlock;

    const slotId = idMatch[1];
    const slotCode = codeMatch ? codeMatch[1] : slotId;
    const title = titleMatch ? titleMatch[1] : slotId;
    const productId = prodMatch[1];

    const best = pickBestCandidate(
      [slotId, slotCode, productId, title],
      candidates,
      { realOnly: true }
    );

    if (best) {
      matchedGalleryFiles.add(best.relPath);
      slotResults.push({ slotId, productId, title, realPhotoUrl: best.publicUrl });
      const newLine = `    realPhotoUrl: '${best.publicUrl}',`;
      if (/^\s*realPhotoUrl:.*$/m.test(slotBlock)) {
        const replaced = slotBlock.replace(/^\s*realPhotoUrl:.*$/m, newLine);
        if (replaced !== slotBlock) changed = true;
        return replaced;
      } else {
        changed = true;
        return slotBlock.replace(/(\n\s*\},)$/, `\n${newLine}$1`);
      }
    } else {
      slotResults.push({ slotId, productId, title, realPhotoUrl: null });
      if (/^\s*realPhotoUrl:.*\n?/m.test(slotBlock)) {
        changed = true;
        return slotBlock.replace(/^\s*realPhotoUrl:.*\r?\n/m, '');
      }
      return slotBlock;
    }
  });

  if (changed) {
    const updatedTsx = tsx.slice(0, startIdx) + updatedArrayBlock + tsx.slice(endIdx);
    fs.writeFileSync(GALLERY_TSX_PATH, updatedTsx, 'utf-8');
  }

  return { slotResults, changed };
}

function buildCatalogJsContent(catalog) {
  const header = `/**
 * ============================================================================
 * 3D PRINT WORKSHOP — STOREFRONT PRODUCT CATALOG CONFIG
 * ============================================================================
 * Auto-synced by \`npm run sync-photos\` (scripts/sync-photos.mjs).
 * Single source of truth for all storefront products and preview image paths.
 *
 * HOW TO SWAP IN REAL PHOTOGRAPHS:
 *   1. Drop real photos (.webp, .jpg, .jpeg, .png) into:
 *        - public/images/gallery/   (featured showcase + matching catalog card)
 *        - public/images/products/  (catalog cards)
 *   2. Run \`npm run sync-photos\` to update gallery slots, catalog JSON/JS,
 *      and rebuild dist/ automatically.
 * ============================================================================
 */
`;
  return `${header}window.PRODUCT_CATALOG = ${JSON.stringify(catalog, null, 2)};\n`;
}

function main() {
  fs.mkdirSync(GALLERY_DIR, { recursive: true });
  fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

  const catalog = readJsonFile(CATALOG_JSON_PATH);
  const starterHashes = loadOrCreateStarterHashes(catalog);
  const candidates = collectPhotoCandidates(starterHashes);
  const matchedGalleryFiles = new Set();

  // 1. Sync showcase gallery slots in src/components/MadeInAtelierGallery.tsx
  const { slotResults, changed: galleryChanged } = updateMadeInAtelierGallery(
    candidates,
    matchedGalleryFiles
  );

  // 2. Sync all catalog products in public/products-catalog.json & public/products-catalog.js
  const realProducts = [];
  const renderProducts = [];
  let catalogChanged = false;

  for (const product of catalog.products || []) {
    const keys = [product.id, product.sku, product.name].filter(Boolean);
    const bestReal = pickBestCandidate(keys, candidates, { realOnly: true });

    if (bestReal) {
      matchedGalleryFiles.add(bestReal.relPath);
      if (product.image !== bestReal.relPath || product.photoStatus !== 'real-photo') {
        product.image = bestReal.relPath;
        product.photoStatus = 'real-photo';
        catalogChanged = true;
      }
      realProducts.push({ id: product.id, name: product.name, image: product.image });
    } else {
      // Fall back to starter render (e.g. images/products/<id>.png)
      const fallbackRender = pickBestCandidate(keys, candidates, { realOnly: false });
      const targetImage = fallbackRender ? fallbackRender.relPath : `images/products/${product.id}.png`;
      if (product.image !== targetImage || product.photoStatus !== 'studio-preview') {
        product.image = targetImage;
        product.photoStatus = 'studio-preview';
        catalogChanged = true;
      }
      renderProducts.push({ id: product.id, name: product.name, image: product.image });
    }
  }

  if (catalogChanged) {
    catalog.updatedAt = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(CATALOG_JSON_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf-8');
    fs.writeFileSync(CATALOG_JS_PATH, buildCatalogJsContent(catalog), 'utf-8');
  }

  // 3. Detect any unmatched files sitting in public/images/gallery/
  const unmatchedGallery = candidates
    .filter((c) => c.source === 'gallery' && !matchedGalleryFiles.has(c.relPath))
    .map((c) => c.fileName);

  // 4. Rebuild dist/ unless --no-build was passed
  if (!skipBuild) {
    console.log('\nBuilding production bundle (`npm run build`)...');
    execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  }

  // 5. Print summary
  const galleryReal = slotResults.filter((s) => s.realPhotoUrl);
  const galleryPending = slotResults.filter((s) => !s.realPhotoUrl);

  console.log('\n============================================================');
  console.log('  MAISON 704 — PHOTO SYNC SUMMARY');
  console.log('============================================================');
  console.log(
    `Showcase Gallery Slots : ${galleryReal.length} / ${slotResults.length} real photos` +
      (galleryChanged ? ' (updated MadeInAtelierGallery.tsx)' : ' (no changes)')
  );
  if (galleryReal.length > 0) {
    for (const s of galleryReal) {
      console.log(`  [REAL] ${s.slotId} (${s.productId}) -> ${s.realPhotoUrl}`);
    }
  }
  if (galleryPending.length > 0) {
    console.log(
      `  [PLACEHOLDER] ${galleryPending.map((s) => `${s.slotId}:${s.productId}`).join(', ')}`
    );
  }

  console.log('');
  console.log(
    `Catalog Products       : ${realProducts.length} / ${(catalog.products || []).length} real photos` +
      (catalogChanged ? ' (updated products-catalog.json & .js)' : ' (no changes)')
  );
  if (realProducts.length > 0) {
    for (const p of realProducts) {
      console.log(`  [REAL] ${p.id} (${p.name}) -> ${p.image}`);
    }
  }
  console.log(`  [3D RENDERS REMAINING] ${renderProducts.length} products`);
  if (renderProducts.length > 0) {
    console.log(`    ${renderProducts.map((p) => p.id).join(', ')}`);
  }

  if (unmatchedGallery.length > 0) {
    console.log('');
    console.log('Unmatched files in public/images/gallery/ (check filename slug):');
    for (const f of unmatchedGallery) {
      console.log(`  [UNMATCHED] ${f}`);
    }
  }
  console.log('============================================================\n');
}

main();
