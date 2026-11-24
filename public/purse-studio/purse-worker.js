/* Purse Studio v4.1 Dedicated Web Worker
 * Runs parametric mesh generation, surface relief displacement,
 * 0°-89° diagonal bed-fit packing, and binary .STL / .3MF ZIP export off-thread
 * using transferable Float32Array / Uint32Array ArrayBuffers.
 */
'use strict';

importScripts('./purse-core.js');

const PS = self.PS;
let lastDesign = null;
let lastAnalysis = null;
let lastStateKey = '';

function packMeshTransferable(m, transferSet) {
  if (!m) return m;
  let pos = m.positions;
  let idx = m.indices;

  // Ensure each packed mesh owns a dedicated Float32Array / Uint32Array buffer
  // so no buffer is double-transferred or detached unexpectedly.
  if (pos instanceof Float32Array) {
    pos = new Float32Array(pos);
  } else {
    pos = new Float32Array(pos || []);
  }

  if (idx instanceof Uint32Array) {
    idx = new Uint32Array(idx);
  } else {
    idx = new Uint32Array(idx || []);
  }

  transferSet.add(pos.buffer);
  transferSet.add(idx.buffer);

  return {
    name: m.name,
    color: m.color,
    part: m.part,
    materialKey: m.materialKey,
    positions: pos,
    indices: idx,
    meta: m.meta || {},
    hidden: m.hidden || false,
  };
}

function packMeshList(list, transferSet) {
  return (list || []).map((m) => packMeshTransferable(m, transferSet));
}

function packDesignTransferable(design, transferSet) {
  return {
    body: packMeshTransferable(design.body, transferSet),
    bodyMeshes: packMeshList(design.bodyMeshes, transferSet),
    lidShell: packMeshTransferable(design.lidShell, transferSet),
    lip: packMeshTransferable(design.lip, transferSet),
    lidMeshes: packMeshList(design.lidMeshes, transferSet),
    separateMeshes: packMeshList(design.separateMeshes, transferSet),
    accessoryMeshes: packMeshList(design.accessoryMeshes, transferSet),
    fitGhost: design.fitGhost ? packMeshTransferable(design.fitGhost, transferSet) : null,
    quality: design.quality,
    landmarks: design.landmarks,
  };
}

function packAnalysisTransferable(analysis, transferSet) {
  const platesPlan = analysis.plates;
  const packedPlates = (platesPlan.plates || []).map((plate) => ({
    cursorX: plate.cursorX,
    cursorY: plate.cursorY,
    rowH: plate.rowH,
    items: (plate.items || []).map((it) => ({
      x: it.x,
      y: it.y,
      w: it.w,
      h: it.h,
      rotated: !!it.rotated,
      rotationDeg: it.rotationDeg != null ? it.rotationDeg : (it.rotated ? 90 : 0),
      diagonal: !!it.diagonal,
      rect: {
        name: it.rect.name,
        w: it.rect.w,
        h: it.rect.h,
        rotatable: it.rect.rotatable,
        bounds: it.rect.bounds,
        angleDeg: it.rect.angleDeg || 0,
        diagonal: !!it.rect.diagonal,
        fit: it.rect.fit || null,
        meshes: packMeshList(it.rect.meshes, transferSet),
        printableMeshes: packMeshList(it.rect.printableMeshes, transferSet),
      },
    })),
  }));

  const packedSplit = platesPlan.split
    ? {
        left: packMeshTransferable(platesPlan.split.left, transferSet),
        right: packMeshTransferable(platesPlan.split.right, transferSet),
        leftMeshes: packMeshList(platesPlan.split.leftMeshes, transferSet),
        rightMeshes: packMeshList(platesPlan.split.rightMeshes, transferSet),
        keys: packMeshList(platesPlan.split.keys, transferSet),
      }
    : null;

  return Object.assign({}, analysis, {
    plates: {
      fits: platesPlan.fits,
      plates: packedPlates,
      unplaced: platesPlan.unplaced
        ? { name: platesPlan.unplaced.name, w: platesPlan.unplaced.w, h: platesPlan.unplaced.h }
        : null,
      split: packedSplit,
      bodyWasOversize: !!platesPlan.bodyWasOversize,
      diagonalFits: platesPlan.diagonalFits || [],
      diagonalSummary: platesPlan.diagonalSummary || '',
    },
  });
}

function ensureBuilt(state, quality, runtime) {
  const key = JSON.stringify({ state, quality, hasMap: !!(runtime && runtime.badgeHeightMap) });
  if (lastDesign && lastAnalysis && lastStateKey === key) {
    return { design: lastDesign, analysis: lastAnalysis };
  }
  const design = PS.G.buildDesign(state, quality || 'standard', runtime || {});
  const analysis = PS.A.analyzeDesign(state, design);
  lastDesign = design;
  lastAnalysis = analysis;
  lastStateKey = key;
  return { design, analysis };
}

self.onmessage = function (event) {
  const msg = event.data || {};

  if (msg.type === 'ping') {
    self.postMessage({ type: 'pong', version: PS.APP_VERSION });
    return;
  }

  if (msg.type === 'build') {
    const t0 = performance.now();
    try {
      const state = msg.state;
      const quality = msg.quality || 'standard';
      const runtime = msg.runtime || {};
      const built = ensureBuilt(state, quality, runtime);

      const transferSet = new Set();
      const packedDesign = packDesignTransferable(built.design, transferSet);
      const packedAnalysis = packAnalysisTransferable(built.analysis, transferSet);
      const transferList = Array.from(transferSet);

      self.postMessage(
        {
          type: 'buildResult',
          id: msg.id,
          ok: true,
          workerMs: performance.now() - t0,
          design: packedDesign,
          analysis: packedAnalysis,
        },
        transferList
      );
    } catch (err) {
      self.postMessage({
        type: 'buildResult',
        id: msg.id,
        ok: false,
        error: String((err && err.stack) || err),
      });
    }
    return;
  }

  if (msg.type === 'export') {
    try {
      const state = msg.state;
      const quality = msg.quality || (state.export && state.export.quality) || 'fine';
      const runtime = msg.runtime || {};
      const format = msg.format;
      const baseName = PS.E.safeName(state.metadata && state.metadata.projectName);
      let bytes = null;
      let filename = `${baseName}.bin`;
      let mimeType = 'application/octet-stream';

      if (format === 'plate3mf') {
        const built = ensureBuilt(state, quality, runtime);
        const plateIdx = Number(msg.plateIndex) || 0;
        const meshes = PS.E.printablePlateMeshes(state, built.analysis.plates, plateIdx);
        bytes = PS.E.build3MF(state, meshes, `${state.metadata.projectName} - Plate ${plateIdx + 1}`);
        filename = `${baseName}_plate_${plateIdx + 1}.3mf`;
        mimeType = 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml';
      } else if (format === 'bundleZip') {
        const built = ensureBuilt(state, quality, runtime);
        bytes = PS.E.plateBundle(state, built.analysis);
        filename = `${baseName}_all_plates.zip`;
        mimeType = 'application/zip';
      } else if (format === 'stl') {
        const built = ensureBuilt(state, quality, runtime);
        let srcMeshes = [];
        let label = msg.label || msg.stlPart || 'part';
        if (msg.stlPart === 'body') srcMeshes = built.design.bodyMeshes;
        else if (msg.stlPart === 'lid') srcMeshes = built.design.lidMeshes;
        else if (msg.stlPart === 'badge') {
          const b = built.design.separateMeshes.find((x) => x.part === 'badge');
          srcMeshes = b ? [b] : [];
        } else if (msg.stlPart === 'body_left_half' && built.analysis.plates.split) {
          srcMeshes = built.analysis.plates.split.leftMeshes;
        } else if (msg.stlPart === 'body_right_half' && built.analysis.plates.split) {
          srcMeshes = built.analysis.plates.split.rightMeshes;
        } else if (msg.stlPart === 'calibration_coupon') {
          srcMeshes = PS.G.buildCalibrationCoupon(state);
        } else if (msg.stlPart === 'closure_test') {
          srcMeshes = PS.G.buildClosureTest(state);
        }

        if (!srcMeshes.length) {
          throw new Error(`No mesh data available for STL export "${label}".`);
        }
        const oriented = PS.E.preparePrintableSTLGroup(state, srcMeshes, label);
        bytes = PS.E.binarySTL(oriented, label);
        filename = `${baseName}_${PS.E.safeName(label)}.stl`;
        mimeType = 'application/octet-stream';
      } else {
        throw new Error(`Unknown export format: ${format}`);
      }

      const outBuf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      self.postMessage(
        {
          type: 'exportResult',
          reqId: msg.reqId,
          ok: true,
          buffer: outBuf,
          filename,
          mimeType,
        },
        [outBuf]
      );
    } catch (err) {
      self.postMessage({
        type: 'exportResult',
        reqId: msg.reqId,
        ok: false,
        error: String((err && err.message) || err),
      });
    }
  }
};
