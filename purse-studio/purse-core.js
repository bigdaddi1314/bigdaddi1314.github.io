/* Purse Studio v4.1 Core Engine (Shared by Main Thread fallback & purse-worker.js) */
(function (root) {
  'use strict';
  const PS = root.PS = root.PS || {};

  const APP_VERSION = '4.1.0';
  const SCHEMA_VERSION = 4;

  const SHAPES = {
    carryall: {label:'Carryall Tote',icon:'◇',category:'custom',sizes:{mini:[158, 75, 128],medium:[210, 100, 170],large:[241, 115, 195]}},
    duffel: {label:'Barrel Duffel',icon:'◇',category:'custom',sizes:{mini:[165, 82, 82],medium:[220, 110, 110],large:[253, 126, 126]}},
    envelope: {label:'Envelope Clutch',icon:'◇',category:'custom',sizes:{mini:[142, 71, 24],medium:[190, 95, 32],large:[218, 109, 37]}},
    pill: {label:'Pill Clutch',icon:'◇',category:'custom',sizes:{mini:[135, 64, 27],medium:[180, 85, 36],large:[207, 98, 41]}},
    halfmoon: {label:'Half-Moon Clutch',icon:'◇',category:'custom',sizes:{mini:[135, 75, 27],medium:[180, 100, 36],large:[207, 115, 41]}},
    artdeco: {label:'Art Deco Clutch',icon:'◇',category:'custom',sizes:{mini:[139, 68, 27],medium:[185, 90, 36],large:[213, 103, 41]}},
    svg: {label:'SVG Silhouette',icon:'◇',category:'custom',sizes:{mini:[135, 75, 30],medium:[180, 100, 40],large:[207, 115, 46]}},
    heart: { label: 'Heart', icon: '♥', category: 'clutch', sizes: { mini:[122,62,88], medium:[156,76,108], large:[192,92,132] } },
    mini_backpack: { label: 'Mini Backpack', icon: '🎒', category: 'backpack', sizes: { mini:[112,68,126], medium:[150,84,164], large:[182,102,206] } },
    saddle_bag: { label: 'Saddle Bag', icon: '◒', category: 'crossbody', sizes: { mini:[132,58,82], medium:[170,74,106], large:[204,90,128] } },
    star5: { label: '5-Point Star', icon: '★', category: 'clutch', sizes: { mini:[126,62,84], medium:[166,80,102], large:[198,94,122] } },
    star6: { label: '6-Point Star', icon: '✦', category: 'clutch', sizes: { mini:[126,62,84], medium:[166,82,102], large:[198,96,122] } },
    tote: { label: 'Structured Tote', icon: '▣', category: 'tote', sizes: { mini:[130,66,110], medium:[176,82,138], large:[210,98,164] } },
    octagon: { label: 'Octagon', icon: '⬡', category: 'clutch', sizes: { mini:[126,62,84], medium:[162,78,104], large:[196,94,126] } },
    hex: { label: 'Hexagon', icon: '⬢', category: 'clutch', sizes: { mini:[126,62,84], medium:[164,80,106], large:[198,96,128] } },
    pentagon: { label: 'Pentagon', icon: '⬟', category: 'clutch', sizes: { mini:[124,62,84], medium:[160,78,102], large:[194,94,124] } },
    diamond: { label: 'Diamond', icon: '◆', category: 'clutch', sizes: { mini:[128,60,82], medium:[168,76,98], large:[202,92,118] } },
    triangle: { label: 'Triangle', icon: '▲', category: 'clutch', sizes: { mini:[128,64,84], medium:[166,82,104], large:[202,98,126] } },
    coffin: { label: 'Coffin', icon: '⚰', category: 'clutch', sizes: { mini:[116,58,102], medium:[148,74,126], large:[178,88,152] } },
    teardrop: { label: 'Teardrop', icon: '💧', category: 'clutch', sizes: { mini:[120,60,92], medium:[156,78,112], large:[188,94,136] } },
    scallop: { label: 'Scallop / Cloud', icon: '✿', category: 'clutch', sizes: { mini:[126,62,84], medium:[162,78,102], large:[196,94,124] } },
    cylinder: { label: 'Drum', icon: '●', category: 'crossbody', sizes: { mini:[114,114,82], medium:[148,148,112], large:[180,180,136] } }
  };

  const PRINTERS = {
    generic220: { label:'Standard 220 mm', bedX:220, bedY:220, bedZ:250, nozzle:0.4, lineWidth:0.44, layerHeight:0.2, minWall:1.32, minHole:2.0, bridge:18, defaultGap:0.32 },
    bambu256: { label:'Bambu / 256 mm', bedX:256, bedY:256, bedZ:256, nozzle:0.4, lineWidth:0.42, layerHeight:0.2, minWall:1.26, minHole:1.8, bridge:22, defaultGap:0.26 },
    anycubic250: { label:'Anycubic / 250 mm', bedX:250, bedY:250, bedZ:250, nozzle:0.4, lineWidth:0.42, layerHeight:0.2, minWall:1.26, minHole:1.9, bridge:20, defaultGap:0.28 },
    mini180: { label:'Compact / 180 mm', bedX:180, bedY:180, bedZ:180, nozzle:0.4, lineWidth:0.42, layerHeight:0.2, minWall:1.26, minHole:1.8, bridge:16, defaultGap:0.28 },
    custom: { label:'Custom Calibrated', bedX:220, bedY:220, bedZ:250, nozzle:0.4, lineWidth:0.44, layerHeight:0.2, minWall:1.32, minHole:2.0, bridge:18, defaultGap:0.30 }
  };

  const MATERIALS = {
    pla:  { label:'PLA / Silk / Matte', density:1.24, gap:0, hole:0, snap:0, shrink:0, flex:0.15, heat:'Low', note:'Easiest choice for decorative bags and rigid hardware.' },
    petg: { label:'PETG', density:1.27, gap:0.05, hole:0.05, snap:-0.06, shrink:0, flex:0.35, heat:'Medium', note:'Tougher and more heat resistant; reduce snap bite slightly.' },
    abs:  { label:'ABS / ASA', density:1.05, gap:0.04, hole:0.06, snap:-0.02, shrink:0.006, flex:0.25, heat:'High', note:'Use an enclosure and brim; the shrink value is retained in the calibrated material profile.' },
    tpu:  { label:'TPU 95A', density:1.21, gap:0.08, hole:0.10, snap:0.22, shrink:0.002, flex:0.9, heat:'Medium', note:'Flexible; deeper snap geometry and larger moving clearances are recommended.' }
  };

  const FIT_ITEMS = {
    phone: { label:'Large phone', dims:[80,12,165] },
    wallet:{ label:'Compact wallet', dims:[105,22,78] },
    glasses:{ label:'Glasses case', dims:[165,45,70] },
    keys:{ label:'Keys bundle', dims:[75,28,45] },
    cards:{ label:'Card deck', dims:[90,22,65] },
    lipstick:{ label:'Lipstick', dims:[25,25,90] },
    switchlite:{ label:'Handheld console', dims:[210,30,92] }
  };

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function defaultState() {
    const d = SHAPES.heart.sizes.medium;
    return {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      experience: 'beginner',
      ui: { mode:'guided', guidedStep:1, activeTab:'shape', viewMode:'assembly', analysisMode:'normal', diagnostics:false, inspector:true, wireframe:false, measureMode:false, section:{active:false,axis:'x',offset:0,flip:false} },
      shape: { type:'heart', sizePreset:'medium', lockProportions:true, heartNotch:1.0, heartBulge:1.0, starValley:0.60, coffinFlare:1.15, roundness:0.18 },
      dimensions: { width:d[0], depth:d[1], height:d[2], lidHeight:26, wall:3.2, floor:3.4, roof:3.0, lipDepth:4.0, bottomChamfer:1.6 },
      printer: { profile:'anycubic250', customName:'My Printer', bedX:250, bedY:250, bedZ:250, nozzle:0.4, lineWidth:0.42, layerHeight:0.2, minWall:1.26, minHole:1.9, bridge:20 },
      material: 'pla',
      calibration: { xyComp:0, holeComp:0, pressFit:0.18, movingGap:0.28, magnetComp:0.15, snapComp:0, elephantFoot:0.15, materialShrink:0 },
      mechanics: { hinge:'filament_pin', closure:'snap', magnet:'8x2', handle:'side_loops', feet:true, lidAngle:38, pinDiameter:1.75 },
      surface: {
        strength:1.4,
        frequency:14,
        zones:{ front:'quilt', back:'smooth', sides:'smooth', lid:'quilt', bottom:'smooth', handle:'smooth' },
        fuzzy:{ mode:'slicer_note', thickness:0.30, distance:0.30 },
        customPattern:{ name:'Built-in Star', dataUrl:null, layout:'brick', relief:'emboss', scale:0.7, rotation:0 }
      },
      personalization: {
        text:'LUX', badgeMode:'separate', badgeWidth:46, badgeHeight:26, badgeDepth:3.0,
        logoDataUrl:null, logoName:null, logoUseAlpha:true,
        placement:{ x:0, y:0.52, scale:1, rotation:0 }, logoTransform:{ x:0, y:0, scale:1, rotation:0 }, relief:'emboss', reliefDepth:1.2,
        colors:{ body:'#ff6b00', lid:'#ff6b00', hardware:'#d4af37', badge:'#f4efe6', interior:'#ff8b42' }
      },
      interior: { divider:false, dividerAxis:'x', dividerPosition:0, cardSlots:0, keyClip:false, airtagPocket:false, falseBottom:false },
      layout: { mode:'auto', spacing:8, splitOversize:true, splitMethod:'glue_keys', rotation:0 },
      accessory: { type:'d_ring', size:24, thickness:3.2, quantity:2 },
      fitCheck: { item:'phone', custom:[80,12,165], showGhost:false, offset:[0,0], elevation:0, rotation:0, autoRotate:true },
      export: { quality:'fine', includeAccessories:true, includeCalibration:false, useBakedFuzzy:false },
      metadata: { projectName:'My Purse', created:new Date().toISOString(), modified:new Date().toISOString() }
    };
  }

  function applyPrinterProfile(state, profileKey) {
    const p = PRINTERS[profileKey] || PRINTERS.generic220;
    state.printer.profile = profileKey;
    if (profileKey !== 'custom') {
      Object.assign(state.printer, { bedX:p.bedX, bedY:p.bedY, bedZ:p.bedZ, nozzle:p.nozzle, lineWidth:p.lineWidth, layerHeight:p.layerHeight, minWall:p.minWall, minHole:p.minHole, bridge:p.bridge });
      state.calibration.movingGap = +(p.defaultGap + (MATERIALS[state.material]?.gap || 0)).toFixed(2);
    }
    return state;
  }

  function applyMaterial(state, key) {
    if (!MATERIALS[key]) key = 'pla';
    state.material = key;
    const p = PRINTERS[state.printer.profile] || PRINTERS.generic220;
    const m = MATERIALS[key];
    state.calibration.movingGap = +(p.defaultGap + m.gap).toFixed(2);
    state.calibration.materialShrink = m.shrink;
    return state;
  }

  function applySizePreset(state, sizeKey) {
    const sh = SHAPES[state.shape.type] || SHAPES.heart;
    const d = sh.sizes[sizeKey] || sh.sizes.medium;
    state.shape.sizePreset = sizeKey;
    state.dimensions.width = d[0];
    state.dimensions.depth = d[1];
    state.dimensions.height = d[2];
    if (state.shape.type === 'mini_backpack' && state.mechanics.handle === 'side_loops') state.mechanics.handle = 'backpack_loops';
    return state;
  }

  function setShape(state, shapeKey) {
    if (!SHAPES[shapeKey]) return state;
    if(shapeKey==='svg'&&!state.shape.outline)return state;
    state.shape.type = shapeKey;
    applySizePreset(state, state.shape.sizePreset || 'medium');
    if(['envelope','pill','halfmoon','artdeco','svg'].includes(shapeKey)){state.dimensions.lidHeight=10;state.mechanics.handle='none';state.mechanics.feet=false;state.surface.strength=0;state.personalization.badgeMode='none';}
    if(['carryall','duffel'].includes(shapeKey)){state.mechanics.handle='both';state.dimensions.lidHeight=20;}
    if(['duffel','envelope','pill','halfmoon','artdeco'].includes(shapeKey)){state.mechanics.hinge='filament_pin';state.mechanics.closure='snap';}
    if(shapeKey==='carryall'){state.mechanics.hinge='clasp_only';state.mechanics.closure='none';}
    if(shapeKey==='artdeco'){state.surface.zones.front='pleats';state.surface.strength=0.8;}
    if (shapeKey === 'mini_backpack') state.mechanics.handle = 'backpack_loops';
    else if (state.mechanics.handle === 'backpack_loops') state.mechanics.handle = 'side_loops';
    return state;
  }

  function migrateState(input) {
    if (!input || typeof input !== 'object') return defaultState();
    const out = defaultState();
    const version = Number(input.schemaVersion || 0);
    if (version >= 4) {
      mergeDeep(out, input);
      out.schemaVersion = SCHEMA_VERSION;
      out.appVersion = APP_VERSION;
      return out;
    }
    const flat = input;
    if (flat.bagShape && SHAPES[flat.bagShape]) out.shape.type = flat.bagShape;
    if (Number.isFinite(+flat.width)) out.dimensions.width = +flat.width;
    if (Number.isFinite(+flat.depth)) out.dimensions.depth = +flat.depth;
    if (Number.isFinite(+flat.height)) out.dimensions.height = +flat.height;
    if (Number.isFinite(+flat.lidHeight)) out.dimensions.lidHeight = +flat.lidHeight;
    if (Number.isFinite(+flat.wall)) out.dimensions.wall = +flat.wall;
    if (Number.isFinite(+flat.floor)) out.dimensions.floor = +flat.floor;
    if (Number.isFinite(+flat.lipDepth)) out.dimensions.lipDepth = +flat.lipDepth;
    if (flat.printerProfile) out.printer.profile = flat.printerProfile === 'bambu' ? 'bambu256' : flat.printerProfile === 'mini' ? 'mini180' : flat.printerProfile === 'anycubic_next' ? 'anycubic250' : 'generic220';
    if (flat.materialProfile && MATERIALS[flat.materialProfile]) out.material = flat.materialProfile;
    if (flat.hingeStyle) out.mechanics.hinge = flat.hingeStyle;
    if (flat.latchStyle) out.mechanics.closure = flat.latchStyle === 'cantilever' ? 'snap' : flat.latchStyle;
    if (flat.handleStyle) out.mechanics.handle = flat.handleStyle;
    if (flat.magnetSpec) out.mechanics.magnet = flat.magnetSpec;
    if (flat.monogramText) out.personalization.text = String(flat.monogramText).slice(0, 12);
    if (Number.isFinite(+flat.badgeWidth)) out.personalization.badgeWidth = +flat.badgeWidth;
    if (Number.isFinite(+flat.badgeHeight)) out.personalization.badgeHeight = +flat.badgeHeight;
    if (Number.isFinite(+flat.badgeDepth)) out.personalization.badgeDepth = +flat.badgeDepth;
    if (flat.texType) out.surface.zones.front = flat.texType;
    if (Number.isFinite(+flat.texDepth)) out.surface.strength = +flat.texDepth;
    if (Number.isFinite(+flat.texScale)) out.surface.frequency = +flat.texScale;
    if (Number.isFinite(+flat.clearance)) out.calibration.movingGap = +flat.clearance;
    if (flat.separateEmblemPlate === false) out.personalization.badgeMode = 'fused';
    if (flat.customTolMods) {
      out.calibration.movingGap += Number(flat.customTolMods.hingeMod || 0);
      out.calibration.snapComp = Number(flat.customTolMods.snapMod || 0);
    }
    applyPrinterProfile(out, out.printer.profile);
    applyMaterial(out, out.material);
    out.metadata.projectName = input.projectName || 'Migrated v3 Project';
    return out;
  }

  function mergeDeep(target, src) {
    Object.keys(src || {}).forEach(k => {
      const v = src[k];
      if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) mergeDeep(target[k], v);
      else target[k] = deepClone(v);
    });
    return target;
  }

  class Store {
    constructor(initial) {
      this.state = migrateState(initial || defaultState());
      this.listeners = new Set();
      this.history = [deepClone(this.state)];
      this.historyIndex = 0;
      this.maxHistory = 60;
      this.suspendHistory = false;
    }
    get() { return this.state; }
    subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
    emit(meta) { this.state.metadata.modified = new Date().toISOString(); this.listeners.forEach(fn => fn(this.state, meta || {})); }
    update(path, value, meta) {
      const keys = Array.isArray(path) ? path : String(path).split('.');
      let obj = this.state;
      for (let i=0;i<keys.length-1;i++) { if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') obj[keys[i]]={}; obj=obj[keys[i]]; }
      obj[keys[keys.length-1]] = value;
      if (!meta || meta.history !== false) this.pushHistory();
      this.emit(Object.assign({path:keys.join('.')}, meta));
    }
    transaction(mutator, meta) { mutator(this.state); if (!meta || meta.history !== false) this.pushHistory(); this.emit(meta || {}); }
    replace(next, meta) { this.state = migrateState(next); this.pushHistory(true); this.emit(meta || {replace:true}); }
    pushHistory(force) {
      if (this.suspendHistory) return;
      const snap = deepClone(this.state);
      const prev = this.history[this.historyIndex];
      if (!force && prev && JSON.stringify(prev) === JSON.stringify(snap)) return;
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(snap);
      if (this.history.length > this.maxHistory) this.history.shift();
      this.historyIndex = this.history.length - 1;
    }
    undo() { if (this.historyIndex <= 0) return false; this.historyIndex--; this.suspendHistory=true; this.state=deepClone(this.history[this.historyIndex]); this.suspendHistory=false; this.emit({undo:true}); return true; }
    redo() { if (this.historyIndex >= this.history.length-1) return false; this.historyIndex++; this.suspendHistory=true; this.state=deepClone(this.history[this.historyIndex]); this.suspendHistory=false; this.emit({redo:true}); return true; }
    reset() { this.replace(defaultState(), {reset:true}); }
  }

  PS.APP_VERSION = APP_VERSION;
  PS.SCHEMA_VERSION = SCHEMA_VERSION;
  PS.SHAPES = SHAPES;
  PS.PRINTERS = PRINTERS;
  PS.MATERIALS = MATERIALS;
  PS.FIT_ITEMS = FIT_ITEMS;
  PS.defaultState = defaultState;
  PS.migrateState = migrateState;
  PS.mergeDeep = mergeDeep;
  PS.applyPrinterProfile = applyPrinterProfile;
  PS.applyMaterial = applyMaterial;
  PS.applySizePreset = applySizePreset;
  PS.setShape = setShape;
  PS.Store = Store;
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
  'use strict';
  const PS = root.PS = root.PS || {};
  const TAU = Math.PI * 2;
  const EPS = 1e-8;

  function mesh(name, color, part, materialKey) {
    return { name:name || 'Mesh', color:color || '#cccccc', part:part || 'part', materialKey:materialKey || part || 'part', positions:[], indices:[], meta:{} };
  }
  function vadd(m,x,y,z){ m.positions.push(x,y,z); return m.positions.length/3-1; }
  function tri(m,a,b,c){ if(a!==b && b!==c && a!==c) m.indices.push(a,b,c); }
  function vget(m,i){ const o=i*3; return [m.positions[o],m.positions[o+1],m.positions[o+2]]; }
  function cloneMesh(m){ return { name:m.name, color:m.color, part:m.part, materialKey:m.materialKey, positions:m.positions.slice(), indices:m.indices.slice(), meta:JSON.parse(JSON.stringify(m.meta||{})) }; }
  function transformMesh(m, fn, name){ const out=cloneMesh(m); if(name) out.name=name; for(let i=0;i<out.positions.length;i+=3){ const p=fn(out.positions[i],out.positions[i+1],out.positions[i+2], i/3); out.positions[i]=p[0]; out.positions[i+1]=p[1]; out.positions[i+2]=p[2]; } return out; }
  function translateMesh(m,x,y,z,name){ return transformMesh(m,(a,b,c)=>[a+x,b+y,c+z],name); }
  function rotateXMesh(m,angle,pivot,name){ const c=Math.cos(angle),s=Math.sin(angle),p=pivot||[0,0,0]; return transformMesh(m,(x,y,z)=>{ const yy=y-p[1],zz=z-p[2]; return [x, p[1]+yy*c-zz*s, p[2]+yy*s+zz*c]; },name); }
  function rotateYMesh(m,angle,pivot,name){ const c=Math.cos(angle),s=Math.sin(angle),p=pivot||[0,0,0]; return transformMesh(m,(x,y,z)=>{ const xx=x-p[0],zz=z-p[2]; return [p[0]+xx*c+zz*s, y, p[2]-xx*s+zz*c]; },name); }
  function rotateZMesh(m,angle,pivot,name){ const c=Math.cos(angle),s=Math.sin(angle),p=pivot||[0,0,0]; return transformMesh(m,(x,y,z)=>{ const xx=x-p[0],yy=y-p[1]; return [p[0]+xx*c-yy*s,p[1]+xx*s+yy*c,z]; },name); }

  function makeBox(name,w,h,d,color,part,center){
    const m=mesh(name,color,part,part), c=center||[0,h/2,0];
    const x=w/2,y=h/2,z=d/2;
    const pts=[[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z],[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]];
    pts.forEach(p=>vadd(m,p[0]+c[0],p[1]+c[1],p[2]+c[2]));
    const f=[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]];
    f.forEach(t=>tri(m,t[0],t[1],t[2]));
    return m;
  }

  function makeCylinder(name,r,h,segs,color,part,axis,center){
    segs=Math.max(8,segs||24); axis=axis||'y'; center=center||[0,0,0];
    const m=mesh(name,color,part,part), a=[],b=[];
    function map(axial,c1,c2){ if(axis==='x') return [axial,c1,c2]; if(axis==='z') return [c1,c2,axial]; return [c1,axial,c2]; }
    for(let i=0;i<segs;i++){ const t=i/segs*TAU, c=Math.cos(t)*r,s=Math.sin(t)*r; let p=map(-h/2,c,s); a.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2])); p=map(h/2,c,s); b.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2])); }
    const ca=map(-h/2,0,0),cb=map(h/2,0,0), ia=vadd(m,ca[0]+center[0],ca[1]+center[1],ca[2]+center[2]), ib=vadd(m,cb[0]+center[0],cb[1]+center[1],cb[2]+center[2]);
    for(let i=0;i<segs;i++){ const n=(i+1)%segs; tri(m,a[i],a[n],b[n]); tri(m,a[i],b[n],b[i]); tri(m,ia,a[n],a[i]); tri(m,ib,b[i],b[n]); }
    return m;
  }

  function makeHollowTube(name,outerR,innerR,length,segs,color,part,axis,center){
    segs=Math.max(12,segs||28); axis=axis||'x'; center=center||[0,0,0]; innerR=Math.min(innerR,outerR-0.25);
    const m=mesh(name,color,part,part), o0=[],o1=[],i0=[],i1=[];
    function map(axial,c1,c2){ if(axis==='x') return [axial,c1,c2]; if(axis==='z') return [c1,c2,axial]; return [c1,axial,c2]; }
    for(let i=0;i<segs;i++){
      const t=i/segs*TAU, co=Math.cos(t),si=Math.sin(t); let p;
      p=map(-length/2,co*outerR,si*outerR); o0.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2]));
      p=map(length/2,co*outerR,si*outerR); o1.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2]));
      p=map(-length/2,co*innerR,si*innerR); i0.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2]));
      p=map(length/2,co*innerR,si*innerR); i1.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2]));
    }
    for(let i=0;i<segs;i++){ const n=(i+1)%segs;
      tri(m,o0[i],o0[n],o1[n]); tri(m,o0[i],o1[n],o1[i]);
      tri(m,i0[i],i1[n],i0[n]); tri(m,i0[i],i1[i],i1[n]);
      tri(m,o0[i],i0[n],o0[n]); tri(m,o0[i],i0[i],i0[n]);
      tri(m,o1[i],o1[n],i1[n]); tri(m,o1[i],i1[n],i1[i]);
    }
    return m;
  }

  function makeTorus(name,majorR,tubeR,segU,segV,color,part,center,axis){
    segU=Math.max(12,segU||28); segV=Math.max(8,segV||12); center=center||[0,0,0]; axis=axis||'y';
    const m=mesh(name,color,part,part), grid=[];
    function map(x,y,z){ if(axis==='x') return [y,x,z]; if(axis==='z') return [x,z,y]; return [x,y,z]; }
    for(let i=0;i<segU;i++){ const u=i/segU*TAU,row=[]; for(let j=0;j<segV;j++){ const v=j/segV*TAU; const rr=majorR+tubeR*Math.cos(v); let p=map(rr*Math.cos(u),tubeR*Math.sin(v),rr*Math.sin(u)); row.push(vadd(m,p[0]+center[0],p[1]+center[1],p[2]+center[2])); } grid.push(row); }
    for(let i=0;i<segU;i++){ const ni=(i+1)%segU; for(let j=0;j<segV;j++){ const nj=(j+1)%segV; tri(m,grid[i][j],grid[ni][j],grid[ni][nj]); tri(m,grid[i][j],grid[ni][nj],grid[i][nj]); } }
    return m;
  }

  function makeTeardropLoop(name,r,tubeR,color,part,center,axis){
    const m=makeTorus(name,r,tubeR,30,12,color,part,[0,0,0],axis||'z');
    for(let i=0;i<m.positions.length;i+=3){ let x=m.positions[i],y=m.positions[i+1],z=m.positions[i+2]; y = y < 0 ? y*1.35 : y*0.92; m.positions[i]=x+(center?.[0]||0); m.positions[i+1]=y+(center?.[1]||0); m.positions[i+2]=z+(center?.[2]||0); }
    return m;
  }

  function resampleOutline(points, count) {
    const lengths = points.map((p, i) => Math.hypot(p[0] - points[(i + 1) % points.length][0], p[1] - points[(i + 1) % points.length][1]));
    const total = lengths.reduce((a, b) => a + b, 0);
    let edge = 0, start = 0;
    return Array.from({length: count}, (_, i) => {
      const distance = i * total / count;
      while (edge < points.length - 1 && start + lengths[edge] < distance) start += lengths[edge++];
      const t = (distance - start) / lengths[edge], a = points[edge], b = points[(edge + 1) % points.length];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    });
  }

  function outlineArea(points) {
    return points.reduce((sum, a, i) => { const b = points[(i + 1) % points.length]; return sum + a[0] * b[1] - b[0] * a[1]; }, 0) / 2;
  }

  function validateOutline(points) {
    if (!Array.isArray(points) || points.length < 3 || points.length > 2048 || points.some(p => !Array.isArray(p) || p.length !== 2 || p.some(v => !Number.isFinite(v)))) throw new Error('The outline needs at least three finite points.');
    if (Math.abs(outlineArea(points)) < 0.001) throw new Error('The outline has no usable area.');
    const cross = (a, b, c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const on = (a,b,p) => Math.abs(cross(a,b,p)) < 1e-8 && p[0] >= Math.min(a[0],b[0])-1e-8 && p[0] <= Math.max(a[0],b[0])+1e-8 && p[1] >= Math.min(a[1],b[1])-1e-8 && p[1] <= Math.max(a[1],b[1])+1e-8;
    for (let i=0;i<points.length;i++) {
      const a=points[i], b=points[(i+1)%points.length];
      if (Math.hypot(a[0]-b[0],a[1]-b[1]) < 1e-8) throw new Error('The outline contains duplicate points.');
      for (let j=i+2;j<points.length;j++) {
        if (i===0 && j===points.length-1) continue;
        const c=points[j],d=points[(j+1)%points.length];
        if ((cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0) || on(a,b,c) || on(a,b,d) || on(c,d,a) || on(c,d,b)) throw new Error('The outline crosses or touches itself. Simplify that part of the SVG.');
      }
    }
    return points;
  }

  function capRing(m, ring, reverse) {
    const points=ring.map(i=>[m.positions[i*3],m.positions[i*3+2]]), remaining=ring.map((_,i)=>i);
    const sign=Math.sign(outlineArea(points));
    const cross=(a,b,c)=>sign*((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]));
    while (remaining.length>3) {
      let found=false;
      for(let k=0;k<remaining.length;k++) {
        const ia=remaining[(k+remaining.length-1)%remaining.length],ib=remaining[k],ic=remaining[(k+1)%remaining.length];
        const a=points[ia],b=points[ib],c=points[ic];
        if(cross(a,b,c)<=1e-9) continue;
        if(remaining.some(i=>i!==ia&&i!==ib&&i!==ic&&cross(a,b,points[i])>=-1e-9&&cross(b,c,points[i])>=-1e-9&&cross(c,a,points[i])>=-1e-9))continue;
        if(reverse)tri(m,ring[ia],ring[ic],ring[ib]);else tri(m,ring[ia],ring[ib],ring[ic]);
        remaining.splice(k,1);found=true;break;
      }
      if(!found)throw new Error('This outline cannot be capped. Increase its size or simplify tight corners.');
    }
    const [a,b,c]=remaining.map(i=>ring[i]);if(reverse)tri(m,a,c,b);else tri(m,a,b,c);
  }

  function buildClosureTest(state) {
    const body=buildBody(state,qualitySpec('draft')),lid=buildLidShell(state,qualitySpec('draft'));
    const hardware=buildHardware(state,body.meta,lid), parts=[];
    const selected=m=>m.part==='latch'||m.part==='magnet';
    for(const [index,group] of [hardware.body.filter(selected),hardware.lid.filter(selected),hardware.separate.filter(selected)].entries()) {
      if(!group.length)continue;
      const bounds=groupBounds(group), dx=index*42-(bounds.min[0]+bounds.max[0])/2;
      group.forEach(m=>parts.push(translateMesh(m,dx,3-bounds.min[1],-bounds.min[2])));
      parts.push(makeBox('Closure test grip '+(index+1),Math.max(28,bounds.size[0]+4),3,Math.max(16,bounds.size[2]+4),state.personalization.colors.body,'calibration',[index*42,1.5,bounds.size[2]/2]));
    }
    if(!parts.length)throw new Error('Choose a snap, magnet, or turn-lock closure first.');
    return parts;
  }

  function regularPolygonRadius(theta,sides,rotation){
    const slice=TAU/sides; let a=(theta+(rotation||0))%slice; if(a<0)a+=slice; a-=slice/2; return Math.cos(Math.PI/sides)/Math.max(0.12,Math.cos(a));
  }
  function superellipse(theta,n){ const sx=Math.sin(theta),cz=Math.cos(theta); const ex=Math.sign(sx)*Math.pow(Math.abs(sx),2/n); const ez=Math.sign(cz)*Math.pow(Math.abs(cz),2/n); return [ex,ez]; }

  function rawContourPoint(shape,theta,state){
    const s=state.shape||{}; let x,z;
    if(shape==='svg') {
      const outline=s.outline;
      if(!outline)throw new Error('Import an SVG outline before selecting this shape.');
      const index=theta/TAU*outline.length,a=Math.floor(index)%outline.length,b=(a+1)%outline.length,t=index-Math.floor(index);
      return [outline[a][0]*(1-t)+outline[b][0]*t,outline[a][1]*(1-t)+outline[b][1]*t];
    } else if(['carryall','envelope','artdeco','duffel','pill','halfmoon'].includes(shape)) {
      if(shape==='halfmoon'){if(theta<=Math.PI){x=-Math.cos(theta);z=Math.sin(theta);}else{x=1-2*(theta-Math.PI)/Math.PI;z=0;}}
      else if(shape==='artdeco'){const r=regularPolygonRadius(theta,8,Math.PI/8);x=Math.sin(theta)*r;z=Math.cos(theta)*r;}
      else if(shape==='envelope'){const r=regularPolygonRadius(theta,5,Math.PI);x=Math.sin(theta)*r;z=Math.cos(theta)*r;}
      else [x,z]=superellipse(theta,shape==='carryall'?5:2.6);
    } else if(shape==='heart'){
      const st=Math.sin(theta),ct=Math.cos(theta);
      x=16*Math.pow(st,3)*(s.heartBulge||1);
      let hy=13*ct-5*Math.cos(2*theta)-2*Math.cos(3*theta)-Math.cos(4*theta);
      const backFactor=Math.max(0,ct); hy += (1-(s.heartNotch||1))*3.5*backFactor;
      z=-hy;
    } else if(shape==='mini_backpack'){
      [x,z]=superellipse(theta,4.8); z*= z>0 ? 0.95 : 1.05;
    } else if(shape==='saddle_bag'){
      [x,z]=superellipse(theta,2.7); z += 0.10*(1-Math.cos(theta));
    } else if(shape==='star5' || shape==='star6'){
      const spikes=shape==='star5'?5:6, valley=Math.max(0.42,Math.min(0.82,s.starValley||0.6));
      const wave=0.5+0.5*Math.cos(spikes*theta); const r=valley+(1-valley)*Math.pow(wave,1.35);
      x=Math.sin(theta)*r; z=Math.cos(theta)*r;
    } else if(shape==='octagon' || shape==='hex' || shape==='pentagon' || shape==='triangle'){
      const sides=shape==='octagon'?8:shape==='hex'?6:shape==='pentagon'?5:3;
      const r=regularPolygonRadius(theta,sides,shape==='triangle'?Math.PI:0); x=Math.sin(theta)*r; z=Math.cos(theta)*r;
    } else if(shape==='diamond'){
      [x,z]=superellipse(theta,1.15);
    } else if(shape==='coffin'){
      const r=regularPolygonRadius(theta,6,0); const dz=Math.cos(theta); let flare=1;
      if(dz<0) flare=0.72+(s.coffinFlare||1.15)*0.25*(1+dz); else flare=1.0+(s.coffinFlare||1.15-1)*0.18;
      x=Math.sin(theta)*r*flare; z=Math.cos(theta)*r;
    } else if(shape==='teardrop'){
      const sn=Math.sin(theta),cs=Math.cos(theta); const taper=0.78-0.28*cs; x=sn*taper; z=cs;
    } else if(shape==='scallop'){
      const r=0.88+0.12*Math.abs(Math.cos(theta*4)); x=Math.sin(theta)*r; z=Math.cos(theta)*r;
    } else if(shape==='tote'){
      [x,z]=superellipse(theta,5.2);
    } else {
      x=Math.sin(theta); z=Math.cos(theta);
    }
    return [x,z];
  }

  function sampleContour(state,n){
    n=state.shape.type==='svg'?state.shape.outline.length:Math.max(24,n||96); if(state.shape.type!=='svg'&&n%4) n+=4-(n%4);
    const shape=state.shape.type, raw=[];
    if(shape==='svg')validateOutline(state.shape.outline);
    for(let i=0;i<n;i++) raw.push(rawContourPoint(shape,i/n*TAU,state));
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    raw.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minZ=Math.min(minZ,p[1]);maxZ=Math.max(maxZ,p[1]);});
    const cx=(minX+maxX)/2,cz=(minZ+maxZ)/2,sx=state.dimensions.width/Math.max(EPS,maxX-minX),sz=state.dimensions.depth/Math.max(EPS,maxZ-minZ);
    if(shape==='svg')validateOutline(raw);
    const round=Math.max(0,Math.min(0.55,state.shape.roundness||0));
    const points=raw.map((p,i)=>{ let x=(p[0]-cx)*sx,z=(p[1]-cz)*sz; if(round>0 && ['star5','star6','octagon','hex','pentagon','triangle','coffin','diamond'].includes(shape)){ const th=i/n*TAU, ex=Math.sin(th)*state.dimensions.width/2,ez=Math.cos(th)*state.dimensions.depth/2,blend=round*0.42; x=x*(1-blend)+ex*blend; z=z*(1-blend)+ez*blend; } return [x,z]; });
    return points;
  }

  function contourNormals(points){
    const sign=Math.sign(outlineArea(points));
    return points.map((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz)||1;return [sign*dz/length,-sign*dx/length];});
  }
  function offsetContour(points,normals,dist){return points.map((p,i)=>[p[0]-normals[i][0]*dist,p[1]-normals[i][1]*dist]);}
  function offsetOutline(points,normals,dist){
    const sign=Math.sign(outlineArea(points));
    return points.map((p,i)=>{
      const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];
      const l1=Math.hypot(p[0]-a[0],p[1]-a[1]),l2=Math.hypot(b[0]-p[0],b[1]-p[1]);
      const n1=[sign*(p[1]-a[1])/l1,-sign*(p[0]-a[0])/l1],n2=[sign*(b[1]-p[1])/l2,-sign*(b[0]-p[0])/l2];
      const denominator=1+n1[0]*n2[0]+n1[1]*n2[1];
      if(denominator<0.02)return [p[0]-normals[i][0]*dist,p[1]-normals[i][1]*dist];
      return [p[0]-(n1[0]+n2[0])*dist/denominator,p[1]-(n1[1]+n2[1])*dist/denominator];
    });
  }
  function scaleContour(points,scale){ return points.map(p=>[p[0]*scale,p[1]*scale]); }
  function stabilizeInnerContour(base,inner,dist,shape){
    if(shape!=='heart'&&shape!=='teardrop')return inner;
    return inner.map((q,i)=>{const p=base[i],r=[q[0],q[1]];
      if(Math.abs(p[0])>1e-6 && p[0]*r[0]<0){r[0]=p[0]*0.35;const dx=p[0]-r[0],dz=Math.sqrt(Math.max(0,dist*dist-dx*dx));r[1]=p[1]-(Math.sign(p[1])||1)*dz;}
      return r;
    });
  }

  function contourLandmarks(points){
    let front=points[0],back=points[0],left=points[0],right=points[0];
    points.forEach(p=>{ if(p[1]>front[1])front=p;if(p[1]<back[1])back=p;if(p[0]<left[0])left=p;if(p[0]>right[0])right=p; });
    return {front:{x:front[0],z:front[1]},back:{x:back[0],z:back[1]},left:{x:left[0],z:left[1]},right:{x:right[0],z:right[1]}};
  }

  function zoneAtPoint(p,state,isLid){ if(isLid)return 'lid'; const a=Math.atan2(p[0],p[1]); if(Math.abs(a)<Math.PI/4)return 'front'; if(Math.abs(a)>Math.PI*3/4)return 'back'; return 'sides'; }
  function hashNoise(a,b){ const x=Math.sin(a*127.1+b*311.7)*43758.5453; return x-Math.floor(x); }
  function patternValue(type,u,v,freq){
    freq=Math.max(2,freq||12); if(!type||type==='smooth')return 0;
    if(type==='quilt'){ const a=Math.abs(Math.sin((u*freq+v*freq*0.55)*Math.PI)),b=Math.abs(Math.sin((u*freq-v*freq*0.55)*Math.PI)); return Math.pow(a*b,0.5); }
    if(type==='chevron'){ const w=Math.abs(((u*2)%1)-0.5)*2; return 0.5+0.5*Math.sin((v*freq*0.7+w*2.4)*TAU); }
    if(type==='woven'){ const a=Math.abs(Math.sin(u*freq*TAU)),b=Math.abs(Math.sin(v*freq*0.5*TAU)),chk=Math.sin(u*freq*Math.PI)*Math.sin(v*freq*0.5*Math.PI); return (chk>0?a:b)*0.9; }
    if(type==='honey'){ const x=u*freq*TAU,y=v*freq*0.52*TAU; return Math.max(0,Math.min(1,(Math.sin(x)*Math.sin(y*0.866)+0.5*Math.sin(y*1.732)+1.5)/3)); }
    if(type==='scales'){ const row=v*freq*0.65,ri=Math.floor(row),rf=row-ri,us=u*freq+(ri%2)*0.5; return Math.max(0,(1-rf*0.72)*Math.abs(Math.sin(us*Math.PI))); }
    if(type==='pleats') return Math.abs(Math.sin(u*freq*Math.PI));
    if(type==='custom'){ const star=Math.cos(u*freq*TAU)*Math.cos(v*freq*0.5*TAU); return Math.pow(Math.max(0,star),1.8); }
    return 0;
  }

  function textureOffset(p,u,v,state,isLid){
    const zone=zoneAtPoint(p,state,isLid),type=state.surface.zones[zone]||'smooth',str=state.surface.strength||0,freq=state.surface.frequency||12;
    let val=patternValue(type,u,v,freq)*str;
    const fade=Math.sin(Math.min(1,v*5)*Math.PI/2)*Math.sin(Math.min(1,(1-v)*5)*Math.PI/2); val*=fade;
    if(state.surface.fuzzy.mode==='baked' || state.export.useBakedFuzzy){ val+=(hashNoise(Math.floor(u*180),Math.floor(v*90))-0.5)*(state.surface.fuzzy.thickness||0.3)*1.3*fade; }
    return Math.max(-state.dimensions.wall*0.45,val);
  }

  function buildBody(state,quality){
    quality=quality||{}; const n=state.shape.type==='svg'?state.shape.outline.length:(quality.segU||96),levels=quality.segV||28; const color=state.personalization.colors.body;
    const base=sampleContour(state,n),normals=contourNormals(base),inner=stabilizeInnerContour(base,(state.shape.type==='svg'?offsetOutline:offsetContour)(base,normals,state.dimensions.wall),state.dimensions.wall,state.shape.type); const lm=contourLandmarks(base);
    if(state.shape.type==='svg'){validateOutline(inner);if(Math.sign(outlineArea(inner))!==Math.sign(outlineArea(base)))throw new Error('Increase silhouette size or reduce wall thickness.');}
    const m=mesh('Bag Body',color,'body','body'); const outR=[],inR=[]; const H=state.dimensions.height,F=Math.min(state.dimensions.floor,H*0.4),ch=state.dimensions.bottomChamfer||0;
    for(let iv=0;iv<=levels;iv++){
      const v=iv/levels,y=v*H,iy=F+v*(H-F); const ro=[],ri=[]; let scl=1;
      if(ch>0 && y<ch) scl=1-Math.min(0.08,ch/Math.max(20,Math.min(state.dimensions.width,state.dimensions.depth)))*(1-y/ch);
      for(let i=0;i<n;i++){
        const p=base[i],nn=normals[i],tex=textureOffset(p,i/n,v,state,false),ox=p[0]*scl*(state.shape.type==='carryall'?0.8+0.2*v:1)+nn[0]*tex,oz=p[1]*scl+nn[1]*tex;
        ro.push(vadd(m,ox,y,oz)); const ip=inner[i]; ri.push(vadd(m,ip[0]*(state.shape.type==='carryall'?0.8+0.2*(iy/H):1),iy,ip[1]));
      }
      outR.push(ro);inR.push(ri);
    }
    for(let iv=0;iv<levels;iv++)for(let i=0;i<n;i++){ const j=(i+1)%n,a=outR[iv][i],b=outR[iv][j],c=outR[iv+1][j],d=outR[iv+1][i]; tri(m,a,b,c);tri(m,a,c,d); const ia=inR[iv][i],ib=inR[iv][j],ic=inR[iv+1][j],id=inR[iv+1][i]; tri(m,ia,ic,ib);tri(m,ia,id,ic); }
    for(let i=0;i<n;i++){ const j=(i+1)%n; tri(m,outR[levels][i],outR[levels][j],inR[levels][j]);tri(m,outR[levels][i],inR[levels][j],inR[levels][i]); }
    if(state.shape.type==='svg'){capRing(m,outR[0],true);capRing(m,inR[0],false);}else{const co=vadd(m,0,0,0),ci=vadd(m,0,F,0);for(let i=0;i<n;i++){const j=(i+1)%n;tri(m,co,outR[0][j],outR[0][i]);tri(m,ci,inR[0][i],inR[0][j]);}}
    m.meta={baseContour:base,innerContour:inner,normals,landmarks:lm,wallSamples:base.map((p,i)=>Math.hypot(p[0]-inner[i][0],p[1]-inner[i][1]))};
    return m;
  }

  function buildLidShell(state,quality){
    quality=quality||{}; const n=state.shape.type==='svg'?state.shape.outline.length:(quality.segU||96),levels=quality.lidV||18; const color=state.personalization.colors.lid; const H=state.dimensions.lidHeight,R=Math.min(state.dimensions.roof,H*0.55);
    const base=sampleContour(state,n),normals=contourNormals(base),innerBase=stabilizeInnerContour(base,(state.shape.type==='svg'?offsetOutline:offsetContour)(base,normals,state.dimensions.wall),state.dimensions.wall,state.shape.type); const m=mesh('Lid Shell',color,'lid','lid'),outR=[],inR=[];
    for(let iv=0;iv<=levels;iv++){ const v=iv/levels,y=v*H,sc=1-0.055*Math.pow(v,1.8),ro=[]; for(let i=0;i<n;i++){ const p=base[i],nn=normals[i],tex=textureOffset(p,i/n,v,state,true)*(1-v*0.7); ro.push(vadd(m,p[0]*sc+nn[0]*tex,y,p[1]*sc+nn[1]*tex)); } outR.push(ro); }
    for(let iv=0;iv<=levels;iv++){ const v=iv/levels,y=v*(H-R),sc=1-0.055*Math.pow(Math.min(1,y/H),1.8),ri=[]; for(let i=0;i<n;i++){ const p=innerBase[i]; ri.push(vadd(m,p[0]*sc,y,p[1]*sc)); } inR.push(ri); }
    for(let iv=0;iv<levels;iv++)for(let i=0;i<n;i++){ const j=(i+1)%n,a=outR[iv][i],b=outR[iv][j],c=outR[iv+1][j],d=outR[iv+1][i];tri(m,a,b,c);tri(m,a,c,d); const ia=inR[iv][i],ib=inR[iv][j],ic=inR[iv+1][j],id=inR[iv+1][i];tri(m,ia,ic,ib);tri(m,ia,id,ic); }
    for(let i=0;i<n;i++){ const j=(i+1)%n;tri(m,outR[0][i],inR[0][j],outR[0][j]);tri(m,outR[0][i],inR[0][i],inR[0][j]); }
    if(state.shape.type==='svg'){capRing(m,outR[levels],false);capRing(m,inR[levels],true);}else{const co=vadd(m,0,H,0),ci=vadd(m,0,H-R,0);for(let i=0;i<n;i++){const j=(i+1)%n;tri(m,co,outR[levels][i],outR[levels][j]);tri(m,ci,inR[levels][j],inR[levels][i]);}}
    m.meta={baseContour:base,innerContour:innerBase,normals,landmarks:contourLandmarks(base)}; return m;
  }

  function buildLip(state,quality){
    const n=state.shape.type==='svg'?state.shape.outline.length:(quality?.segU||96),base=sampleContour(state,n),normals=contourNormals(base),gap=state.calibration.movingGap + (PS.MATERIALS[state.material]?.gap||0)*0.25;
    const outer=stabilizeInnerContour(base,(state.shape.type==='svg'?offsetOutline:offsetContour)(base,normals,state.dimensions.wall+gap),state.dimensions.wall+gap,state.shape.type),inner=stabilizeInnerContour(base,(state.shape.type==='svg'?offsetOutline:offsetContour)(base,normals,state.dimensions.wall+gap+Math.max(1.6,state.printer.lineWidth*4)),state.dimensions.wall+gap+Math.max(1.6,state.printer.lineWidth*4),state.shape.type); const depth=state.dimensions.lipDepth;
    if(state.shape.type==='svg'){validateOutline(outer);validateOutline(inner);}
    const m=mesh('Registration Lip',state.personalization.colors.lid,'lip','lid'),ot=[],ob=[],it=[],ib=[];
    for(let i=0;i<n;i++){ ot.push(vadd(m,outer[i][0],0.2,outer[i][1]));ob.push(vadd(m,outer[i][0],-depth,outer[i][1]));it.push(vadd(m,inner[i][0],0.2,inner[i][1]));ib.push(vadd(m,inner[i][0],-depth,inner[i][1])); }
    for(let i=0;i<n;i++){ const j=(i+1)%n;tri(m,ot[i],ot[j],ob[j]);tri(m,ot[i],ob[j],ob[i]);tri(m,it[i],ib[j],it[j]);tri(m,it[i],ib[i],ib[j]);tri(m,ob[i],ob[j],ib[j]);tri(m,ob[i],ib[j],ib[i]);tri(m,ot[i],it[j],ot[j]);tri(m,ot[i],it[i],it[j]); }
    return m;
  }

  function parseMagnet(spec){ if(spec==='6x2')return {d:6,t:2}; if(spec==='10x3')return {d:10,t:3}; return {d:8,t:2}; }

  function buildHardware(state, bodyMeta, lidLocal){
    const out={body:[],lid:[],separate:[]}, c=state.personalization.colors.hardware, H=state.dimensions.height, lm=bodyMeta.landmarks, gap=state.calibration.movingGap, span=Math.min(48,state.dimensions.width*0.38), outerR=5.2;
    const hz=lm.back.z-2.4, frontZ=lm.front.z+1.4;
    if(state.mechanics.hinge==='filament_pin'){
      const boreR=state.mechanics.pinDiameter/2 + Math.max(0.12,gap*0.55),len=span*0.27,offset=span*0.34;
      [-offset,offset].forEach((x,k)=>{ out.body.push(makeHollowTube('Body Hinge '+(k+1),outerR,boreR,len,28,c,'hinge','x',[x,H,hz])); out.body.push(makeBox('Hinge Gusset '+(k+1),len,5.2,7,c,'hinge',[x,H-2.2,hz+2.8])); });
      out.lid.push(makeHollowTube('Lid Center Hinge',outerR-0.15,boreR,span*0.31,28,c,'hinge','x',[0,0,hz])); out.lid.push(makeBox('Lid Hinge Bridge',span*0.31,5.0,7,c,'hinge',[0,2.2,hz+2.8]));
    } else if(state.mechanics.hinge==='pip_barrel'){
      const boreR=2.35+gap*0.4,pinR=Math.max(1.45,boreR-gap),len=span*0.26,offset=span*0.34;
      [-offset,offset].forEach((x,k)=>{ out.body.push(makeHollowTube('PIP Body Barrel '+(k+1),outerR,boreR,len,30,c,'hinge','x',[x,H,hz])); out.body.push(makeBox('PIP Gusset '+(k+1),len,5.2,7,c,'hinge',[x,H-2.2,hz+2.8])); });
      out.lid.push(makeCylinder('Captive PIP Pin',pinR,span*0.88,30,c,'hinge','x',[0,0,hz])); out.lid.push(makeBox('PIP Lid Bridge',span*0.34,6.0,7,c,'hinge',[0,2.6,hz+2.8]));
    }

    if(state.mechanics.closure==='snap'){
      const bite=Math.max(0.35,0.85-gap*0.45+(PS.MATERIALS[state.material]?.snap||0)+state.calibration.snapComp);
      out.body.push(makeBox('Snap Catch',16,5.5,3.0+bite,c,'latch',[0,H-5.2,frontZ+1.4]));
      out.lid.push(makeBox('Flex Snap Arm',19,14,3.0,c,'latch',[0,-5.2,frontZ+2.7]));
      out.lid.push(makeBox('Snap Hook',15,2.8,1.3+bite,c,'latch',[0,-11,frontZ+1.6]));
    } else if(state.mechanics.closure==='turnlock'){
      out.body.push(makeBox('Turn Lock Plate',22,14,2.4,c,'latch',[0,H-8,frontZ+1.3]));
      out.separate.push(makeCylinder('Rotating Turn Lock Post',3.2,7,24,c,'latch','z',[0,H-8,frontZ+5]));
      out.separate.push(makeBox('Turn Lock Toggle',12,3.8,2.5,c,'latch',[0,H-8,frontZ+8]));
      out.lid.push(makeBox('Turn Lock Hasp Left',5,16,3,c,'latch',[-6,-6,frontZ+3])); out.lid.push(makeBox('Turn Lock Hasp Right',5,16,3,c,'latch',[6,-6,frontZ+3])); out.lid.push(makeBox('Turn Lock Hasp Bar',17,4,3,c,'latch',[0,-12,frontZ+3]));
    } else if(state.mechanics.closure==='magnetic'){
      const mag=parseMagnet(state.mechanics.magnet),innerR=mag.d/2+state.calibration.magnetComp+(PS.MATERIALS[state.material]?.hole||0)*0.5,outer=innerR+2.0;
      const bodyCup=makeHollowTube('Body Magnet Cup',outer,innerR,mag.t+1.2,30,c,'magnet','z',[0,H-mag.d/2-3,lm.front.z-state.dimensions.wall-outer]);
      const lidCup=makeHollowTube('Lid Magnet Cup',outer,innerR,mag.t+1.2,30,c,'magnet','z',[0,mag.d/2+2,lm.front.z-state.dimensions.wall-outer]);
      out.body.push(bodyCup); out.lid.push(lidCup);
    }

    if(state.mechanics.handle==='side_loops' || state.mechanics.handle==='both'){
      out.body.push(makeTeardropLoop('Right Strap Loop',7.2,2.7,c,'handle',[lm.right.x+2.2,H*0.78,0],'z'));
      out.body.push(makeTeardropLoop('Left Strap Loop',7.2,2.7,c,'handle',[lm.left.x-2.2,H*0.78,0],'z'));
    } else if(state.mechanics.handle==='backpack_loops'){
      [-22,22].forEach((x,i)=>out.body.push(makeTeardropLoop('Backpack Loop '+(i+1),7.5,2.7,c,'handle',[x,H*0.62,lm.back.z-1.5],'z')));
    }
    if(state.mechanics.handle==='top_arch' || state.mechanics.handle==='both'){
      const spanW=Math.min(78,state.dimensions.width*0.5),major=spanW/2; const tor=makeTorus('Top Arch Handle',major,4.0,40,12,c,'handle',[0,state.dimensions.lidHeight+major*0.65,0],'z');
      out.lid.push(tor);
    }
    if(state.mechanics.feet){ [[-0.34,-0.34],[0.34,-0.34],[-0.34,0.34],[0.34,0.34]].forEach((q,i)=>out.body.push(makeCylinder('Foot '+(i+1),4.5,2.2,20,c,'feet','y',[q[0]*state.dimensions.width,1.1,q[1]*state.dimensions.depth]))); }
    return out;
  }

  function buildBadge(state,heightMap){
    const w=state.personalization.badgeWidth,h=state.personalization.badgeHeight,d=state.personalization.badgeDepth,base=Math.max(1.2,d*0.55),rel=Math.max(0.4,state.personalization.reliefDepth||d-base),nx=48,ny=28;
    const m=mesh('Personalized Badge',state.personalization.colors.badge,'badge','badge'),top=[],bot=[];
    function sample(u,v){ if(!heightMap||!heightMap.data)return 0; const x=Math.max(0,Math.min(heightMap.w-1,Math.floor(u*(heightMap.w-1)))),y=Math.max(0,Math.min(heightMap.h-1,Math.floor((1-v)*(heightMap.h-1)))); return heightMap.data[y*heightMap.w+x]||0; }
    for(let iy=0;iy<=ny;iy++){ const v=iy/ny,tr=[],br=[]; for(let ix=0;ix<=nx;ix++){ const u=ix/nx,x=(u-0.5)*w,y=(v-0.5)*h,edge=(ix<2||iy<2||ix>nx-2||iy>ny-2)?0.32:0,hm=Math.max(edge,sample(u,v)); const z=Math.max(0.6,base+hm*rel*(state.personalization.relief==='deboss'?-0.45:1)); tr.push(vadd(m,x,y,z));br.push(vadd(m,x,y,0)); }top.push(tr);bot.push(br); }
    for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){ const a=top[iy][ix],b=top[iy][ix + 1],c=top[iy+1][ix+1],dd=top[iy+1][ix];tri(m,a,b,c);tri(m,a,c,dd);const ba=bot[iy][ix],bb=bot[iy][ix+1],bc=bot[iy+1][ix+1],bd=bot[iy+1][ix];tri(m,ba,bc,bb);tri(m,ba,bd,bc); }
    for(let ix=0;ix<nx;ix++){ tri(m,bot[0][ix],bot[0][ix+1],top[0][ix+1]);tri(m,bot[0][ix],top[0][ix+1],top[0][ix]);tri(m,bot[ny][ix],top[ny][ix+1],bot[ny][ix+1]);tri(m,bot[ny][ix],top[ny][ix],top[ny][ix+1]); }
    for(let iy=0;iy<ny;iy++){ tri(m,bot[iy][0],top[iy+1][0],bot[iy+1][0]);tri(m,bot[iy][0],top[iy][0],top[iy+1][0]);tri(m,bot[iy][nx],bot[iy+1][nx],top[iy+1][nx]);tri(m,bot[iy][nx],top[iy+1][nx],top[iy][nx]); }
    return m;
  }

  function buildBadgeFrame(state,bodyMeta){
    const out=[]; if(state.personalization.badgeMode!=='separate')return out; const w=state.personalization.badgeWidth+state.calibration.pressFit*2,h=state.personalization.badgeHeight+state.calibration.pressFit*2,c=state.personalization.colors.hardware,z=bodyMeta.landmarks.front.z+1.6,y=state.dimensions.height*state.personalization.placement.y;
    const rail=2.0,depth=2.4; out.push(makeBox('Badge Frame Top',w+rail*2,rail,depth,c,'badge_frame',[state.personalization.placement.x,y+h/2+rail/2,z]));out.push(makeBox('Badge Frame Bottom',w+rail*2,rail,depth,c,'badge_frame',[state.personalization.placement.x,y-h/2-rail/2,z]));out.push(makeBox('Badge Frame Left',rail,h,depth,c,'badge_frame',[state.personalization.placement.x-w/2-rail/2,y,z]));out.push(makeBox('Badge Frame Right',rail,h,depth,c,'badge_frame',[state.personalization.placement.x+w/2+rail/2,y,z])); return out;
  }

  function placeBadgeOnBody(state,badge,bodyMeta){
    const y=state.dimensions.height*state.personalization.placement.y,x=state.personalization.placement.x,z=bodyMeta.landmarks.front.z+2.6; let b=rotateZMesh(badge,(state.personalization.placement.rotation||0)*Math.PI/180,[0,0,0]); b=translateMesh(b,x,y,z); return b;
  }

  function buildInterior(state,bodyMeta){
    const arr=[],c=state.personalization.colors.interior,W=Math.max(10,state.dimensions.width-2*state.dimensions.wall-2),D=Math.max(10,state.dimensions.depth-2*state.dimensions.wall-2),H=state.dimensions.height;
    if(state.interior.divider){ if(state.interior.dividerAxis==='x')arr.push(makeBox('Interior Divider',Math.max(1.2,state.printer.lineWidth*3),H*0.55,D*0.82,c,'interior',[state.interior.dividerPosition,H*0.31,0])); else arr.push(makeBox('Interior Divider',W*0.82,H*0.55,Math.max(1.2,state.printer.lineWidth*3),c,'interior',[0,H*0.31,state.interior.dividerPosition])); }
    for(let i=0;i<Math.max(0,Math.min(4,state.interior.cardSlots||0));i++){ arr.push(makeBox('Card Slot '+(i+1),72,1.4,12,c,'interior',[0,H*0.28+i*11,bodyMeta.landmarks.back.z+state.dimensions.wall+8])); }
    if(state.interior.keyClip)arr.push(makeTorus('Key Clip',8,2.2,24,10,c,'interior',[W*0.34,H*0.64,bodyMeta.landmarks.back.z+state.dimensions.wall+5],'z'));
    if(state.interior.airtagPocket)arr.push(makeHollowTube('AirTag Pocket',18,15.8,5,34,c,'interior','z',[-W*0.27,H*0.28,bodyMeta.landmarks.back.z+state.dimensions.wall+5]));
    if(state.interior.falseBottom)arr.push(makeBox('False Bottom',W*0.92,2.2,D*0.9,c,'interior',[0,state.dimensions.floor+10,0]));
    return arr;
  }

  function buildAccessory(state){
    const c=state.personalization.colors.hardware,s=state.accessory.size||24,t=state.accessory.thickness||3.2,type=state.accessory.type;
    if(type==='d_ring')return makeTeardropLoop('Accessory D-Ring',s*0.32,t,c,'accessory',[0,0,0],'z');
    if(type==='chain_link'){ const tor=makeTorus('Accessory Chain Link',s*0.34,t,30,12,c,'accessory',[0,0,0],'z'); for(let i=0;i<tor.positions.length;i+=3)tor.positions[i]*=0.72; return tor; }
    if(type==='charm_heart'){ const fake=JSON.parse(JSON.stringify(state));fake.shape.type='heart';fake.dimensions.width=s;fake.dimensions.depth=s*0.45;fake.dimensions.height=Math.max(3,t);fake.surface.strength=0;fake.mechanics.feet=false; const b=buildBody(fake,{segU:64,segV:4}); b.name='Heart Charm';b.part='accessory';b.color=c; return b; }
    if(type==='buckle'){ const outer=makeBox('Buckle Outer',s,s*0.68,t,c,'accessory',[0,0,0]); outer.meta.visualOnly=true; return outer; }
    return makeTorus('Accessory Ring',s*0.34,t,30,12,c,'accessory',[0,0,0],'z');
  }

  function buildFitGhost(state,bodyMeta){
    const item=state.fitCheck.item==='custom'?{dims:state.fitCheck.custom}:PS.FIT_ITEMS[state.fitCheck.item]; if(!item)return null; const d=item.dims; return makeBox('Fit Item',d[0],d[2],d[1],'#6ee7ff','fit_ghost',[0,state.dimensions.floor+d[2]/2+2,0]);
  }

  function qualitySpec(name){ if(name==='draft')return {segU:64,segV:16,lidV:12}; if(name==='ultra')return {segU:220,segV:64,lidV:34}; if(name==='fine')return {segU:160,segV:46,lidV:28}; return {segU:104,segV:30,lidV:18}; }

  function buildDesign(state,qualityName,runtime){
    const q=qualitySpec(qualityName||'standard'),body=buildBody(state,q),lidShell=buildLidShell(state,q),lip=buildLip(state,q),hw=buildHardware(state,body.meta,lidShell),badge=buildBadge(state,runtime?.badgeHeightMap),frame=buildBadgeFrame(state,body.meta),interior=buildInterior(state,body.meta),meshes=[body].concat(hw.body,frame,interior);
    let badgePlaced=null; if(state.personalization.badgeMode==='fused'){ badgePlaced=placeBadgeOnBody(state,badge,body.meta); meshes.push(badgePlaced); }
    const lidLocal=state.shape.type==='carryall'?[]:[lidShell,lip].concat(hw.lid);
    if(state.shape.type==='carryall'){
      for(const sign of [-1,1]){const handle=makeTorus('Carryall handle',Math.min(42,state.dimensions.width/4),4,40,12,state.personalization.colors.hardware,'handle',[0,state.dimensions.height+22,sign*(state.dimensions.depth/2-2)],'z');meshes.push(handle);}
    }
 const separate=[].concat(hw.separate); if(state.personalization.badgeMode==='separate')separate.push(badge);
    const acc=[]; if(state.export.includeAccessories && state.accessory.quantity>0){ for(let i=0;i<state.accessory.quantity;i++){ let a=buildAccessory(state); a=translateMesh(a,(i-(state.accessory.quantity-1)/2)*(state.accessory.size+8),0,0,'Accessory '+(i+1));acc.push(a); } }
    return {body,bodyMeshes:meshes,lidShell,lip,lidMeshes:lidLocal,separateMeshes:separate,accessoryMeshes:acc,fitGhost:state.fitCheck.showGhost?buildFitGhost(state,body.meta):null,quality:q,landmarks:body.meta.landmarks};
  }

  function transformLidAssembly(meshes,state,landmarks,angleDeg){
    const angle=-(angleDeg==null?state.mechanics.lidAngle:angleDeg)*Math.PI/180,pivot=[0,state.dimensions.height,landmarks.back.z-2.4];
    return meshes.map(m=>{ let w=translateMesh(m,0,state.dimensions.height,0); return rotateXMesh(w,angle,pivot,m.name); });
  }

  function meshBounds(m){ let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity; for(let i=0;i<m.positions.length;i+=3){const x=m.positions[i],y=m.positions[i+1],z=m.positions[i+2];if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;if(z<minZ)minZ=z;if(z>maxZ)maxZ=z;} if(!isFinite(minX))return {min:[0,0,0],max:[0,0,0],size:[0,0,0]}; return {min:[minX,minY,minZ],max:[maxX,maxY,maxZ],size:[maxX-minX,maxY-minY,maxZ-minZ]}; }
  function groupBounds(meshes){ let b={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}; meshes.forEach(m=>{const q=meshBounds(m);for(let k=0;k<3;k++){b.min[k]=Math.min(b.min[k],q.min[k]);b.max[k]=Math.max(b.max[k],q.max[k]);}}); if(!isFinite(b.min[0]))return {min:[0,0,0],max:[0,0,0],size:[0,0,0]};b.size=b.max.map((v,i)=>v-b.min[i]);return b; }

  function weldSimple(input,tol){
    tol=tol||1e-5; const out=mesh(input.name,input.color,input.part,input.materialKey),map=new Map(),old=[];
    for(let i=0;i<input.positions.length;i+=3){const x=input.positions[i],y=input.positions[i+1],z=input.positions[i+2],k=`${Math.round(x/tol)},${Math.round(y/tol)},${Math.round(z/tol)}`;let id=map.get(k);if(id===undefined){id=vadd(out,x,y,z);map.set(k,id);}old[i/3]=id;}
    for(let i=0;i<input.indices.length;i+=3){const a=old[input.indices[i]],b=old[input.indices[i+1]],c=old[input.indices[i+2]];if(a!==b&&b!==c&&a!==c)tri(out,a,b,c);}out.meta=JSON.parse(JSON.stringify(input.meta||{}));return out;
  }
  function clipMeshX(input,keepPositive,name){
    const raw=mesh(name||input.name,input.color,input.part,input.materialKey),sign=keepPositive?1:-1;
    const addP=p=>vadd(raw,p[0],p[1],p[2]);
    function inside(p){return sign*p[0]>=-1e-7;}
    function intersect(a,b){const den=b[0]-a[0],t=Math.abs(den)<1e-12?0:(-a[0]/den);return[0,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
    function clipPoly(poly){const res=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=inside(a),ib=inside(b);if(ia)res.push(a);if(ia!==ib)res.push(intersect(a,b));}return res;}
    for(let k=0;k<input.indices.length;k+=3){const cp=clipPoly([vget(input,input.indices[k]),vget(input,input.indices[k+1]),vget(input,input.indices[k+2])]);if(cp.length>=3){const ids=cp.map(addP);for(let j=1;j<ids.length-1;j++)tri(raw,ids[0],ids[j],ids[j+1]);}}
    const out=weldSimple(raw,1e-5),edgeCount=new Map();function ek(a,b){return a<b?`${a}:${b}`:`${b}:${a}`;}
    for(let i=0;i<out.indices.length;i+=3){const a=out.indices[i],b=out.indices[i+1],c=out.indices[i+2];[[a,b],[b,c],[c,a]].forEach(e=>{const k=ek(e[0],e[1]);edgeCount.set(k,(edgeCount.get(k)||0)+1);});}
    const planeEdges=[];edgeCount.forEach((cnt,k)=>{if(cnt!==1)return;const [a,b]=k.split(':').map(Number),pa=vget(out,a),pb=vget(out,b);if(Math.abs(pa[0])<1e-4&&Math.abs(pb[0])<1e-4)planeEdges.push([a,b]);});
    const adj=new Map();planeEdges.forEach(([a,b])=>{if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a);});
    const used=new Set(),loops=[];function ekey(a,b){return a<b?`${a}:${b}`:`${b}:${a}`;}
    for(const [sa,sb] of planeEdges){if(used.has(ekey(sa,sb)))continue;const loop=[sa];let prev=-1,cur=sa,next=sb,guard=0;while(guard++<10000){used.add(ekey(cur,next));prev=cur;cur=next;if(cur===sa)break;loop.push(cur);const ns=(adj.get(cur)||[]).filter(n=>n!==prev&&!used.has(ekey(cur,n)));if(!ns.length){const all=(adj.get(cur)||[]).filter(n=>n!==prev);if(!all.length)break;next=all[0];}else next=ns[0];}if(loop.length>=3&&cur===sa)loops.push(loop);}
    let capTriangles=0;loops.forEach(ids=>{const poly=ids.map(id=>{const p=vget(out,id);return[0,p[1],p[2]];}),tt=earClipYZ(poly);tt.forEach(t=>{if(keepPositive)tri(out,ids[t[0]],ids[t[2]],ids[t[1]]);else tri(out,ids[t[0]],ids[t[1]],ids[t[2]]);capTriangles++;});});
    out.meta.split=true;out.meta.splitLoops=loops.length;out.meta.capTriangles=capTriangles;return out;
  }
  function polyAreaYZ(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p[1]*q[2]-q[1]*p[2];}return a/2;}
  function earClipYZ(poly){
    const n=poly.length;if(n<3)return[];const idx=[...Array(n).keys()],out=[];const ccw=polyAreaYZ(poly)>0;
    function cross(a,b,c){const ay=a[1],az=a[2],by=b[1],bz=b[2],cy=c[1],cz=c[2];return (by-ay)*(cz-az)-(bz-az)*(cy-ay);}
    function pin(p,a,b,c){const c1=cross(a,b,p),c2=cross(b,c,p),c3=cross(c,a,p);return ccw?(c1>=-1e-8&&c2>=-1e-8&&c3>=-1e-8):(c1<=1e-8&&c2<=1e-8&&c3<=1e-8);}
    let guard=0;while(idx.length>3&&guard++<n*n){let clipped=false;for(let ii=0;ii<idx.length;ii++){const ia=idx[(ii-1+idx.length)%idx.length],ib=idx[ii],ic=idx[(ii+1)%idx.length],cr=cross(poly[ia],poly[ib],poly[ic]);if(ccw?cr<=1e-8:cr>=-1e-8)continue;let has=false;for(const j of idx){if(j===ia||j===ib||j===ic)continue;if(pin(poly[j],poly[ia],poly[ib],poly[ic])){has=true;break;}}if(has)continue;out.push([ia,ib,ic]);idx.splice(ii,1);clipped=true;break;}if(!clipped)break;}if(idx.length===3)out.push([idx[0],idx[1],idx[2]]);return out;
  }

  function buildCalibrationCoupon(state){
    const c=state.personalization.colors.hardware,parts=[]; const base=makeBox('Calibration Base',76,3.2,30,c,'calibration',[0,1.6,0]);parts.push(base);
    const gap=state.calibration.movingGap,pin=state.mechanics.pinDiameter||1.75,bore=pin/2+Math.max(0.12,gap*0.55);
    parts.push(makeHollowTube('Coupon Hinge Bore A',5.0,bore,10,28,c,'calibration','x',[-24,8,-6]));
    parts.push(makeHollowTube('Coupon Hinge Bore B',5.0,bore+0.05,10,28,c,'calibration','x',[-11,8,-6]));
    const lipT=Math.max(1.6,state.printer.lineWidth*4),clr=state.calibration.movingGap*0.85;
    parts.push(makeBox('Coupon Lip Plug',14,8,lipT,c,'calibration',[8,7,8]));
    parts.push(makeBox('Coupon Lip Rail L',2.4,10,lipT+clr*2+4,c,'calibration',[0,8,-4]));
    parts.push(makeBox('Coupon Lip Rail R',2.4,10,lipT+clr*2+4,c,'calibration',[16,8,-4]));
    if(state.mechanics.closure==='snap'){
      const bite=Math.max(0.35,0.85-gap*0.45+(PS.MATERIALS[state.material]?.snap||0)+state.calibration.snapComp);
      parts.push(makeBox('Coupon Snap Catch',10,11,3.0+bite,c,'calibration',[29,7,-6]));
      parts.push(makeBox('Coupon Snap Arm',10,11,2.6,c,'calibration',[29,7,1.5]));
    } else if(state.mechanics.closure==='magnetic'){
      const mag=parseMagnet(state.mechanics.magnet),ir=mag.d/2+state.calibration.magnetComp;
      parts.push(makeHollowTube('Coupon Magnet Fit',ir+2,ir,mag.t+1.0,30,c,'calibration','y',[29,3.7,2]));
    } else if(state.mechanics.closure==='turnlock'){
      parts.push(makeBox('Coupon Turnlock Slot',18,4,8,c,'calibration',[29,5,0]));
      parts.push(makeCylinder('Coupon Turnlock Post',3.2,7,24,c,'calibration','y',[29,6,8]));
    }
    return parts;
  }

  function orientPrintableGroup(name,meshes){
    let out=(meshes||[]).map(cloneMesh); const lower=String(name||'').toLowerCase();
    if(lower.indexOf('lid')>=0){ out=out.map(m=>rotateXMesh(m,Math.PI,[0,0,0],m.name)); }
    else if(out.length && out.every(m=>['badge','accessory'].includes(m.part))){ out=out.map(m=>rotateXMesh(m,-Math.PI/2,[0,0,0],m.name)); }
    const b=groupBounds(out); if(Math.abs(b.min[1])>1e-7)out=out.map(m=>translateMesh(m,0,-b.min[1],0,m.name));
    return out;
  }

  function buildBodyHalf(state,quality,keepPositive){
    quality=quality||qualitySpec('draft'); const n=quality.segU||64,levels=quality.segV||16,color=state.personalization.colors.body;
    const base=sampleContour(state,n),normals=contourNormals(base),inner=stabilizeInnerContour(base,(state.shape.type==='svg'?offsetOutline:offsetContour)(base,normals,state.dimensions.wall),state.dimensions.wall,state.shape.type),H=state.dimensions.height,F=Math.min(state.dimensions.floor,H*0.4),ch=state.dimensions.bottomChamfer||0;
    const path=[]; if(keepPositive){for(let i=0;i<=n/2;i++)path.push(i%n);}else{for(let i=n/2;i<=n;i++)path.push(i%n);}
    const m=mesh(keepPositive?'Body Right Half':'Body Left Half',color,'body','body'),outR=[],inR=[];
    for(let iv=0;iv<=levels;iv++){
      const v=iv/levels,y=v*H,iy=F+v*(H-F);let scl=1;if(ch>0&&y<ch)scl=1-Math.min(0.08,ch/Math.max(20,Math.min(state.dimensions.width,state.dimensions.depth)))*(1-y/ch);
      const ro=[],ri=[];for(const idx of path){const p=base[idx],nn=normals[idx],tex=textureOffset(p,idx/n,v,state,false);ro.push(vadd(m,p[0]*scl+nn[0]*tex,y,p[1]*scl+nn[1]*tex));const ip=inner[idx];ri.push(vadd(m,ip[0]*(state.shape.type==='carryall'?0.8+0.2*(iy/H):1),iy,ip[1]));}outR.push(ro);inR.push(ri);
    }
    const plen=path.length;
    for(let iv=0;iv<levels;iv++)for(let i=0;i<plen-1;i++){const a=outR[iv][i],b=outR[iv][i+1],c=outR[iv+1][i+1],d=outR[iv+1][i];tri(m,a,b,c);tri(m,a,c,d);const ia=inR[iv][i],ib=inR[iv][i+1],ic=inR[iv+1][i+1],id=inR[iv+1][i];tri(m,ia,ic,ib);tri(m,ia,id,ic);}
    for(let i=0;i<plen-1;i++){tri(m,outR[levels][i],outR[levels][i+1],inR[levels][i+1]);tri(m,outR[levels][i],inR[levels][i+1],inR[levels][i]);}
    function capPath(ids,reverse){const poly=ids.map(id=>{const p=vget(m,id);return[0,p[0],p[2]];}),tt=earClipYZ(poly);tt.forEach(t=>reverse?tri(m,ids[t[0]],ids[t[2]],ids[t[1]]):tri(m,ids[t[0]],ids[t[1]],ids[t[2]]));}
    capPath(outR[0],true);capPath(inR[0],false);
    const cutIds=[];
    for(let iv=0;iv<=levels;iv++)cutIds.push(outR[iv][0]);
    cutIds.push(inR[levels][0]);
    for(let iv=levels-1;iv>=0;iv--)cutIds.push(inR[iv][0]);
    cutIds.push(inR[0][plen-1]);
    for(let iv=1;iv<=levels;iv++)cutIds.push(inR[iv][plen-1]);
    cutIds.push(outR[levels][plen-1]);
    for(let iv=levels-1;iv>=0;iv--)cutIds.push(outR[iv][plen-1]);
    const cutPoly=cutIds.map(id=>{const p=vget(m,id);return[0,p[1],p[2]];}),ct=earClipYZ(cutPoly);ct.forEach(t=>keepPositive?tri(m,cutIds[t[0]],cutIds[t[2]],cutIds[t[1]]):tri(m,cutIds[t[0]],cutIds[t[1]],cutIds[t[2]]));
    m.meta={split:true,side:keepPositive?'right':'left',baseContour:base,innerContour:inner,normals,landmarks:contourLandmarks(base)};return m;
  }

  function buildSplitBody(state,design){
    const leftMeshes=[clipMeshX(design.body,false,'Body Left Half')],rightMeshes=[clipMeshX(design.body,true,'Body Right Half')],keys=[];
    (design.bodyMeshes||[]).slice(1).forEach(src=>{
      const b=meshBounds(src),crosses=b.min[0]<-1e-6&&b.max[0]>1e-6;
      if(crosses){const r=clipMeshX(src,true,(src.name||'Part')+' / Right'),l=clipMeshX(src,false,(src.name||'Part')+' / Left');if(r.indices.length)rightMeshes.push(r);if(l.indices.length)leftMeshes.push(l);}
      else if((b.min[0]+b.max[0])*0.5>=0)rightMeshes.push(cloneMesh(src));else leftMeshes.push(cloneMesh(src));
    });
    if(state.layout.splitMethod==='glue_keys'){const h=state.dimensions.height;[-0.18,0.22].forEach((f,i)=>keys.push(makeBox('Internal Seam Key '+(i+1),12,34,3.0,state.personalization.colors.hardware,'join_key',[0,h*(0.46+f),0])));}
    return {left:leftMeshes[0],right:rightMeshes[0],leftMeshes,rightMeshes,keys};
  }

  PS.G = { validateOutline,outlineArea,resampleOutline,buildClosureTest, mesh,vadd,tri,vget,cloneMesh,transformMesh,translateMesh,rotateXMesh,rotateYMesh,rotateZMesh,makeBox,makeCylinder,makeHollowTube,makeTorus,makeTeardropLoop,sampleContour,contourNormals,offsetContour,stabilizeInnerContour,contourLandmarks,buildBody,buildLidShell,buildLip,buildHardware,buildBadge,buildBadgeFrame,buildInterior,buildAccessory,buildFitGhost,buildCalibrationCoupon,buildDesign,transformLidAssembly,meshBounds,groupBounds,clipMeshX,buildBodyHalf,buildSplitBody,orientPrintableGroup,qualitySpec,parseMagnet };
})(typeof window !== 'undefined' ? window : globalThis);

(function(root){
  'use strict';
  const PS=root.PS=root.PS||{}, G=PS.G;
  const EPS=1e-9;

  function weldMesh(m,tol){
    tol=tol||1e-5; const out=G.mesh(m.name,m.color,m.part,m.materialKey),map=new Map(),oldToNew=[];
    for(let i=0;i<m.positions.length;i+=3){ const x=m.positions[i],y=m.positions[i+1],z=m.positions[i+2],k=`${Math.round(x/tol)},${Math.round(y/tol)},${Math.round(z/tol)}`; let ni=map.get(k); if(ni===undefined){ni=G.vadd(out,x,y,z);map.set(k,ni);} oldToNew[i/3]=ni; }
    for(let i=0;i<m.indices.length;i+=3){ const a=oldToNew[m.indices[i]],b=oldToNew[m.indices[i+1]],c=oldToNew[m.indices[i+2]]; if(a!==b&&b!==c&&a!==c)G.tri(out,a,b,c); }
    out.meta=JSON.parse(JSON.stringify(m.meta||{})); return out;
  }

  function triangleData(m,ia,ib,ic){
    const a=G.vget(m,ia),b=G.vget(m,ib),c=G.vget(m,ic),ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2]; let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx; const l=Math.hypot(nx,ny,nz),area=l*0.5;if(l>EPS){nx/=l;ny/=l;nz/=l;}return {a,b,c,n:[nx,ny,nz],area};
  }

  function topology(m){
    const w=weldMesh(m,1e-4),edges=new Map(); let degenerate=0,area=0,signed=0;
    function ek(a,b){return a<b?`${a}:${b}`:`${b}:${a}`;}
    for(let i=0;i<w.indices.length;i+=3){ const a=w.indices[i],b=w.indices[i+1],c=w.indices[i+2],td=triangleData(w,a,b,c);area+=td.area;if(td.area<1e-7)degenerate++;[[a,b],[b,c],[c,a]].forEach(e=>edges.set(ek(e[0],e[1]),(edges.get(ek(e[0],e[1]))||0)+1)); const p=td.a,q=td.b,r=td.c;signed+=(p[0]*(q[1]*r[2]-q[2]*r[1])-p[1]*(q[0]*r[2]-q[2]*r[0])+p[2]*(q[0]*r[1]-q[1]*r[0]))/6; }
    let boundary=0,nonManifold=0;edges.forEach(v=>{if(v===1)boundary++;else if(v!==2)nonManifold++;});
    return {vertices:w.positions.length/3,triangles:w.indices.length/3,boundaryEdges:boundary,nonManifoldEdges:nonManifold,degenerateTriangles:degenerate,edgeManifold:boundary===0&&nonManifold===0&&degenerate===0,surfaceArea:area,volume:Math.abs(signed)};
  }

  function meshVolume(m){ return topology(m).volume; }
  function totalVolume(meshes){ return meshes.reduce((s,m)=>s+meshVolume(m),0); }

  function overhangAnalysis(meshes,threshold){
    threshold=threshold==null?45:threshold; let totalArea=0,overArea=0,worst=0,count=0;
    meshes.forEach(m=>{for(let i=0;i<m.indices.length;i+=3){const td=triangleData(m,m.indices[i],m.indices[i+1],m.indices[i+2]);totalArea+=td.area;if(td.n[1]<-0.001){const deg=Math.asin(Math.min(1,-td.n[1]))*180/Math.PI;worst=Math.max(worst,deg);if(deg>threshold){overArea+=td.area;count++;}}}});
    return {threshold,worstAngle:worst,overhangArea:overArea,totalArea,percent:totalArea?overArea/totalArea*100:0,triangles:count};
  }

  function pointInPolyXZ(x,z,poly){ let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],zi=poly[i][1],xj=poly[j][0],zj=poly[j][1];const cross=((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi+1e-20)+xi);if(cross)inside=!inside;}return inside; }

  function hingeSweep(state,design){
    if(state.shape.type==='carryall'||state.mechanics.hinge==='clasp_only')return {maxSafeAngle:125,firstCollision:null,checked:true};
    const outer=design.body.meta.baseContour,inner=design.body.meta.innerContour,H=state.dimensions.height,F=state.dimensions.floor,pivot=[0,H,design.landmarks.back.z-2.4],src=design.lidShell;
    function collides(angleDeg){const a=-angleDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);for(let i=0;i<src.positions.length;i+=3){const x=src.positions[i],ly=src.positions[i+1]+H,lz=src.positions[i+2],yr=ly-pivot[1],zr=lz-pivot[2],y=pivot[1]+yr*c-zr*s,z=pivot[2]+yr*s+zr*c;if(y>H-0.35)continue;if(y<F+0.3){if(pointInPolyXZ(x,z,outer))return true;continue;}const inOuter=pointInPolyXZ(x,z,outer),inInner=pointInPolyXZ(x,z,inner);if(inOuter&&!inInner)return true;}return false;}
    let first=null,max=125;for(let a=0;a<=125;a+=2.5){if(collides(a)){first=a;max=Math.max(0,a-2.5);break;}}return {maxSafeAngle:max,firstCollision:first,checked:true};
  }

  function minFeatureAnalysis(state){
    const nozzle=state.printer.nozzle,line=state.printer.lineWidth,minWall=Math.max(state.printer.minWall,line*3),issues=[];
    if(state.dimensions.wall<minWall)issues.push({kind:'wall',value:state.dimensions.wall,min:minWall,text:`Shell wall ${state.dimensions.wall.toFixed(2)} mm is below recommended ${minWall.toFixed(2)} mm.`});
    const lipT=Math.max(1.6,line*4); if(lipT<line*3)issues.push({kind:'lip',value:lipT,min:line*3,text:'Registration lip is thinner than three extrusion lines.'});
    const relief=state.personalization.reliefDepth;if(relief<state.printer.layerHeight*2)issues.push({kind:'relief',value:relief,min:state.printer.layerHeight*2,text:'Badge relief may be too shallow to reproduce cleanly.'});
    const estimatedLogoStroke=state.personalization.badgeWidth/Math.max(7,(state.personalization.text||'').length*4.5);if(estimatedLogoStroke<nozzle*1.15)issues.push({kind:'logo',value:estimatedLogoStroke,min:nozzle*1.15,text:'Personalization may contain details below nozzle capability.'});
    return {minWall,issues,ok:issues.length===0};
  }

  function cavityDimensions(state,design){
    const inner=design.body.meta.innerContour;let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;inner.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minZ=Math.min(minZ,p[1]);maxZ=Math.max(maxZ,p[1]);});return [maxX-minX,maxZ-minZ,state.dimensions.height-state.dimensions.floor];
  }
  function itemFit(state,design){
    const item=state.fitCheck.item==='custom'?{label:'Custom object',dims:state.fitCheck.custom}:PS.FIT_ITEMS[state.fitCheck.item];
    if(!item)return null;
    const d=item.dims.map(Number),cav=cavityDimensions(state,design);
    if(d.some(v=>!Number.isFinite(v)||v<=0))return {label:item.label,fits:false,best:{margin:-1,dims:[1,1,1]},detail:'Enter positive dimensions for every side.'};
    const offset=state.fitCheck.offset||[0,0], rotation=Number(state.fitCheck.rotation||0)*Math.PI/180;
    const bottom=state.dimensions.floor+Number(state.fitCheck.elevation||0);
    const inner=design.body.meta.innerContour.map(p=>[p[0]*(state.shape.type==='carryall'?0.8:1),p[1]]);
    const obstacles=design.bodyMeshes.filter(m=>['interior','hinge','magnet'].includes(m.part)).map(m=>({name:m.name,bounds:G.meshBounds(m)}));
    const permutations=state.fitCheck.autoRotate===false?[[0,1,2]]:[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
    let best=null;
    for(const permutation of permutations){
      const q=permutation.map(i=>d[i]),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[offset[0]+Math.cos(rotation)*x*q[0]/2-Math.sin(rotation)*z*q[1]/2,offset[1]+Math.sin(rotation)*x*q[0]/2+Math.cos(rotation)*z*q[1]/2]);
      let margin=state.dimensions.height-(design.lidMeshes.length?state.dimensions.lipDepth:0)-bottom-q[2], reason='Lid clearance';
      if(bottom<state.dimensions.floor){margin=-1;reason='Floor clearance';}
      for(let edge=0;edge<4;edge++)for(let step=0;step<=40;step++){
        const a=corners[edge],b=corners[(edge+1)%4],x=a[0]+(b[0]-a[0])*step/40,z=a[1]+(b[1]-a[1])*step/40;
        let distance=Infinity;
        for(let j=0;j<inner.length;j++){
          const p=inner[j],r=inner[(j+1)%inner.length],dx=r[0]-p[0],dz=r[1]-p[1],t=Math.max(0,Math.min(1,((x-p[0])*dx+(z-p[1])*dz)/(dx*dx+dz*dz)));
          distance=Math.min(distance,Math.hypot(x-p[0]-t*dx,z-p[1]-t*dz));
        }
        const signed=pointInPolyXZ(x,z,inner)?distance:-distance;
        if(signed<margin){margin=signed;reason='Opening or inner wall';}
      }
      const minX=Math.min(...corners.map(p=>p[0])),maxX=Math.max(...corners.map(p=>p[0])),minZ=Math.min(...corners.map(p=>p[1])),maxZ=Math.max(...corners.map(p=>p[1]));
      for(const obstacle of obstacles){const b=obstacle.bounds;
        if(maxX>b.min[0]&&minX<b.max[0]&&maxZ>b.min[2]&&minZ<b.max[2]&&bottom< b.max[1]&&state.dimensions.height>b.min[1]){margin=Math.min(margin,-0.1);reason='Insertion path overlaps '+obstacle.name;}
      }
      if(!best||margin>best.margin)best={dims:q,margin,perm:permutation,reason};
    }
    return {label:item.label||'Custom object',itemDims:d,cavity:cav,fits:best.margin>=0,best,detail:best.margin>=0?'Fits the sampled opening and closed cavity.':'Check '+best.reason.toLowerCase()+'.'};
  }

  function convexHullXZ(meshes){
    const pts=[];
    for(const m of (meshes||[])){
      const pos=m.positions;
      for(let i=0;i<pos.length;i+=3) pts.push([pos[i],pos[i+2]]);
    }
    if(pts.length<=3) return pts;
    pts.sort((a,b)=>a[0]!==b[0]?a[0]-b[0]:a[1]-b[1]);
    const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lower=[];
    for(const p of pts){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}
    const upper=[];
    for(let i=pts.length-1;i>=0;i--){const p=pts[i];while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
    upper.pop(); lower.pop();
    return lower.concat(upper);
  }

  function rotatedBoundsXZ(hull, angleDeg){
    if(!hull||!hull.length) return {w:0,h:0};
    const rad=angleDeg*Math.PI/180, c=Math.cos(rad), s=Math.sin(rad);
    let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
    for(let i=0;i<hull.length;i++){
      const x=hull[i][0], z=hull[i][1];
      const rx=x*c+z*s, rz=-x*s+z*c;
      if(rx<minX)minX=rx; if(rx>maxX)maxX=rx;
      if(rz<minZ)minZ=rz; if(rz>maxZ)maxZ=rz;
    }
    return {w:maxX-minX,h:maxZ-minZ};
  }

  function findOptimalBedRotation(printableMeshes, bedX, bedY, edgeMargin){
    const marginPad=edgeMargin==null?4:Math.max(0,edgeMargin);
    const usableX=Math.max(10,bedX-marginPad*2), usableY=Math.max(10,bedY-marginPad*2);
    const b0=G.groupBounds(printableMeshes);
    const straightW=b0.size[0], straightH=b0.size[2];
    if(straightW<=usableX&&straightH<=usableY){
      return {fits:true,angleDeg:0,diagonal:false,w:straightW,h:straightH,margin:Math.min(usableX-straightW,usableY-straightH),straightW,straightH};
    }
    if(straightH<=usableX&&straightW<=usableY){
      return {fits:true,angleDeg:90,diagonal:false,w:straightH,h:straightW,margin:Math.min(usableX-straightH,usableY-straightW),straightW,straightH};
    }

    // Straight X/Y exceeded build plate bounds: automatically sweep 0°-89° diagonal orientations
    const hull=convexHullXZ(printableMeshes);
    let bestFit=null;
    let bestMiss=null;
    for(let deg=0;deg<=89;deg++){
      const rb=rotatedBoundsXZ(hull,deg);
      const clr=Math.min(usableX-rb.w,usableY-rb.h);
      const area=rb.w*rb.h;
      if(rb.w<=usableX&&rb.h<=usableY){
        if(!bestFit||clr>bestFit.margin+0.25||(Math.abs(clr-bestFit.margin)<=0.25&&area<bestFit.area)){
          bestFit={fits:true,angleDeg:deg,diagonal:deg!==0,w:rb.w,h:rb.h,margin:clr,area,straightW,straightH};
        }
      } else if(!bestMiss||clr>bestMiss.margin){
        bestMiss={fits:false,angleDeg:deg,diagonal:false,w:rb.w,h:rb.h,margin:clr,area,straightW,straightH};
      }
    }
    if(bestFit){ delete bestFit.area; return bestFit; }
    if(bestMiss){ delete bestMiss.area; return bestMiss; }
    return {fits:false,angleDeg:0,diagonal:false,w:straightW,h:straightH,margin:Math.min(usableX-straightW,usableY-straightH),straightW,straightH};
  }

  function rectangleForMeshes(name,meshes,rotatable,bedX,bedY,spacing){
    const printable=G.orientPrintableGroup(name,meshes),b=G.groupBounds(printable);
    const rect={name,meshes,printableMeshes:printable,w:b.size[0],h:b.size[2],rotatable:rotatable!==false,bounds:b,angleDeg:0,diagonal:false,fit:null};
    if(bedX&&bedY&&rect.rotatable){
      const edgePad=Math.min(spacing==null?8:spacing,4);
      const fit=findOptimalBedRotation(printable,bedX,bedY,edgePad);
      rect.fit=fit;
      if(fit.fits&&fit.diagonal){
        rect.angleDeg=fit.angleDeg;
        rect.diagonal=true;
        rect.w=fit.w;
        rect.h=fit.h;
      }
    }
    return rect;
  }

  function packRects(rects,bedX,bedY,spacing){
    spacing=spacing==null?8:spacing;const sorted=rects.slice().sort((a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h)),plates=[];
    function tryPlate(plate,r){
      if(r.diagonal){
        if(plate.items.length>0)return false;
        const pad=Math.min(spacing,4);
        if(r.w<=bedX-pad*2&&r.h<=bedY-pad*2){
          const x=(bedX-r.w)/2,y=(bedY-r.h)/2;
          plate.items.push({rect:r,x,y,w:r.w,h:r.h,rotated:false,rotationDeg:r.angleDeg,diagonal:true});
          plate.cursorX=bedX;plate.cursorY=bedY;plate.rowH=r.h;
          return true;
        }
        return false;
      }
      let opts=[[r.w,r.h,false,0]];
      if(r.rotatable&&Math.abs(r.w-r.h)>0.1)opts.push([r.h,r.w,true,90]);
      for(const o of opts){
        let x=plate.cursorX,y=plate.cursorY,rowH=plate.rowH;
        if(x+o[0]>bedX-spacing){x=spacing;y=plate.cursorY+rowH+spacing;rowH=0;}
        if(y+o[1]<=bedY-spacing){
          plate.items.push({rect:r,x,y,w:o[0],h:o[1],rotated:o[2],rotationDeg:o[3],diagonal:false});
          plate.cursorX=x+o[0]+spacing;plate.cursorY=y;plate.rowH=Math.max(rowH,o[1]);
          return true;
        }
      }
      return false;
    }
    for(const r of sorted){
      let placed=false;
      for(const p of plates)if(tryPlate(p,r)){placed=true;break;}
      if(!placed){
        const p={items:[],cursorX:spacing,cursorY:spacing,rowH:0};
        if(tryPlate(p,r)){plates.push(p);placed=true;}
        else if(r.rotatable&&!r.diagonal){
          const diag=findOptimalBedRotation(r.printableMeshes||r.meshes,bedX,bedY,Math.min(spacing,4));
          if(diag.fits){
            r.fit=diag;r.diagonal=diag.diagonal;r.angleDeg=diag.angleDeg;r.w=diag.w;r.h=diag.h;
            const x=(bedX-diag.w)/2,y=(bedY-diag.h)/2;
            p.items.push({rect:r,x,y,w:diag.w,h:diag.h,rotated:diag.angleDeg===90,rotationDeg:diag.angleDeg,diagonal:diag.diagonal});
            p.cursorX=bedX;p.cursorY=bedY;p.rowH=diag.h;
            plates.push(p);placed=true;
          }
        }
      }
      if(!placed)return {fits:false,plates,unplaced:r};
    }
    return {fits:true,plates,unplaced:null};
  }

  function platePlan(state,design){
    const parts=[],bedX=state.printer.bedX,bedY=state.printer.bedY,spacing=state.layout.spacing;
    const bodyRect=rectangleForMeshes('Body',design.bodyMeshes,true,bedX,bedY,spacing);
    const bodyFit=bodyRect.fit||findOptimalBedRotation(bodyRect.printableMeshes,bedX,bedY,Math.min(spacing,4));
    const tooBig=!bodyFit.fits;
    let split=null;
    if(tooBig&&state.layout.splitOversize){split=G.buildSplitBody(state,design);parts.push(rectangleForMeshes('Body Left',split.leftMeshes,true,bedX,bedY,spacing),rectangleForMeshes('Body Right',split.rightMeshes,true,bedX,bedY,spacing));split.keys.forEach((k,i)=>parts.push(rectangleForMeshes('Join Key '+(i+1),[k],true,bedX,bedY,spacing)));}
    else parts.push(bodyRect);
    if(design.lidMeshes.length)parts.push(rectangleForMeshes('Lid',design.lidMeshes,true,bedX,bedY,spacing));
    design.separateMeshes.forEach((m,i)=>parts.push(rectangleForMeshes(m.name||('Separate '+(i+1)),[m],true,bedX,bedY,spacing)));
    design.accessoryMeshes.forEach((m,i)=>parts.push(rectangleForMeshes(m.name||('Accessory '+(i+1)),[m],true,bedX,bedY,spacing)));
    const plan=packRects(parts,bedX,bedY,spacing);
    const diagonalFits=[];
    (plan.plates||[]).forEach(pl=>pl.items.forEach(it=>{
      if(it.diagonal&&it.rotationDeg>0&&it.rotationDeg<90){
        diagonalFits.push({name:it.rect.name,angleDeg:it.rotationDeg,w:it.w,h:it.h,margin:it.rect.fit?.margin??0});
      }
    }));
    plan.split=split;
    plan.bodyWasOversize=tooBig;
    plan.diagonalFits=diagonalFits;
    plan.diagonalSummary=diagonalFits.length?diagonalFits.map(d=>`${d.name} fits diagonally at ${d.angleDeg}°`).join(' · '):'';
    return plan;
  }

  function printEstimate(state,meshes){
    const vol=totalVolume(meshes),mat=PS.MATERIALS[state.material]||PS.MATERIALS.pla,grams=vol/1000*mat.density,filArea=Math.PI*Math.pow(1.75/2,2),meters=vol/filArea/1000,cost=grams/1000*22;const flow=Math.max(2.5,state.printer.nozzle*state.printer.layerHeight*48),seconds=vol/flow*1.28;return {volumeMm3:vol,grams,filamentMeters:meters,costUSD:cost,minutes:seconds/60};
  }

  function wallAnalysis(state,design){const a=design.body.meta.wallSamples||[],min=a.length?Math.min.apply(null,a):state.dimensions.wall,max=a.length?Math.max.apply(null,a):state.dimensions.wall,rec=Math.max(state.printer.minWall,state.printer.lineWidth*3);return {samples:a,min,max,recommended:rec,ok:min>=rec};}

  function analyzeDesign(state,design){
    const allStructural=design.bodyMeshes.concat(design.lidMeshes,design.separateMeshes),bodyTopo=topology(design.body),lidTopo=topology(design.lidShell),lipTopo=topology(design.lip),componentTopologies=allStructural.map(m=>({name:m.name,part:m.part,topology:topology(m)})),wall=wallAnalysis(state,design),overhang=overhangAnalysis(allStructural,45),features=minFeatureAnalysis(state),sweep=hingeSweep(state,design),fit=itemFit(state,design),plates=platePlan(state,design),estimate=printEstimate(state,allStructural.concat(design.accessoryMeshes));
    const checks=[];let score=100,critical=false;
    function add(status,title,detail,action,mode){checks.push({status,title,detail,action,mode});if(status==='warn')score-=5;if(status==='error'){score-=15;critical=true;}}
    add(bodyTopo.edgeManifold?'ok':'error','Body topology',bodyTopo.edgeManifold?`Closed edge-manifold body (${bodyTopo.triangles.toLocaleString()} triangles).`:`Boundary edges ${bodyTopo.boundaryEdges}, non-manifold edges ${bodyTopo.nonManifoldEdges}, degenerate ${bodyTopo.degenerateTriangles}.`,null,'topology');
    if(design.lidMeshes.length)add(lidTopo.edgeManifold?'ok':'error','Lid topology',lidTopo.edgeManifold?`Closed edge-manifold lid (${lidTopo.triangles.toLocaleString()} triangles).`:`Lid has ${lidTopo.boundaryEdges} boundary edges / ${lidTopo.nonManifoldEdges} non-manifold edges.`,null,'topology');
    if(design.lidMeshes.length)add(lipTopo.edgeManifold?'ok':'error','Registration lip',lipTopo.edgeManifold?'Registration lip is a closed printable ring.':'Registration lip topology requires repair.',null,'topology');
    const badComponents=componentTopologies.filter(x=>!x.topology.edgeManifold);
    if(badComponents.length)add('error','Component topology',`${badComponents.length} component(s) have open/non-manifold edges: ${badComponents.slice(0,4).map(x=>x.name).join(', ')}.`,'Show topology heat map','topology');
    else add('ok','Component topology',`All ${componentTopologies.length} generated structural components are closed edge-manifold meshes.`,null,'topology');
    add(wall.ok?'ok':'error','Wall thickness',`Minimum ${wall.min.toFixed(2)} mm; printer recommendation ${wall.recommended.toFixed(2)} mm.`,wall.ok?null:'Increase wall thickness','wall');
    if(features.issues.length)add('warn','Minimum feature size',features.issues.map(x=>x.text).join(' '),'Simplify / thicken features','feature');else add('ok','Minimum feature size','No configured feature is below the current nozzle/profile limits.',null,'feature');
    if(overhang.percent>28)add('warn','Overhangs',`${overhang.percent.toFixed(1)}% of analyzed downward-facing area exceeds 45°. Supports may be needed.`,'Show overhang heat map','overhang');else add('ok','Overhangs',`${overhang.percent.toFixed(1)}% of area exceeds 45°; worst sampled angle ${overhang.worstAngle.toFixed(0)}°.`,null,'overhang');
    if(state.mechanics.hinge!=='clasp_only'){if(sweep.firstCollision!=null && state.mechanics.lidAngle>sweep.maxSafeAngle)add('error','Hinge sweep',`Geometry sampling predicts shell interference above about ${sweep.maxSafeAngle.toFixed(0)}°.`,'Reduce lid angle / increase hinge offset','collision');else add('ok','Hinge sweep',sweep.firstCollision==null?'No shell collision found through 125° in the sampled sweep.':`Selected ${state.mechanics.lidAngle}° is below the sampled collision threshold (~${sweep.maxSafeAngle.toFixed(0)}°).`,null,'collision');}
    if(plates.fits){
      const diagNote=plates.diagonalFits&&plates.diagonalFits.length?` Fits diagonally at ${plates.diagonalFits[0].angleDeg}° (${plates.diagonalSummary}; Z-rotation auto-applied in STL/3MF).`:'';
      add(plates.plates.length>1?'warn':'ok','Build plates',`${plates.plates.length} plate${plates.plates.length===1?'':'s'} required on ${state.printer.bedX}×${state.printer.bedY} mm.${diagNote} ${plates.bodyWasOversize&&plates.split?'Body automatically split with seam keys.':''}`.trim(),plates.plates.length>1||plates.diagonalFits?.length?'View plate plan':null,'bed');
    } else {
      add('error','Build plates',`Part “${plates.unplaced?.name||'unknown'}” cannot fit the selected ${state.printer.bedX}×${state.printer.bedY} mm printer even after 0°–89° diagonal sweep and split logic.`,'Choose larger printer or smaller size','bed');
    }
    if(plates.split){const sl=topology(plates.split.left),sr=topology(plates.split.right);add(sl.edgeManifold&&sr.edgeManifold?'ok':'error','Split shell topology',sl.edgeManifold&&sr.edgeManifold?'Both automatically generated body halves are closed edge-manifold shells.':`Split shell requires repair (left boundary ${sl.boundaryEdges}, right boundary ${sr.boundaryEdges}).`,null,'topology');}
    if(fit)add(fit.fits?'ok':'warn','What fits inside',fit.fits?`${fit.label} fits with about ${fit.best.margin.toFixed(1)} mm minimum clearance in its best orientation.`:`${fit.label} does not fit the current inner cavity.`,'Show item ghost','fit');
    const gap=state.calibration.movingGap,recGap=(PS.PRINTERS[state.printer.profile]?.defaultGap||0.30)+(PS.MATERIALS[state.material]?.gap||0); if(gap<Math.max(0.16,recGap-0.08))add('warn','Moving clearance',`${gap.toFixed(2)} mm is aggressive for the selected printer/material; calibrated recommendation is about ${recGap.toFixed(2)} mm.`,'Run calibration','fit'); else add('ok','Moving clearance',`${gap.toFixed(2)} mm moving gap is compatible with the selected profile.`,null,'fit');
    add('info','Attachment strategy','Handles, hinge mounts and decorative hardware are exported as closed overlapping components inside the same 3MF object group. Universal 3MF is recommended over STL because slicers preserve these components more reliably.',null,'topology');
    score=Math.max(0,Math.min(100,score));return {score,critical,checks,bodyTopo,lidTopo,lipTopo,componentTopologies,wall,overhang,features,sweep,fit,plates,estimate};
  }

  PS.A={weldMesh,triangleData,topology,meshVolume,totalVolume,overhangAnalysis,pointInPolyXZ,hingeSweep,minFeatureAnalysis,cavityDimensions,itemFit,convexHullXZ,rotatedBoundsXZ,findOptimalBedRotation,rectangleForMeshes,packRects,platePlan,printEstimate,wallAnalysis,analyzeDesign};
})(typeof window!=='undefined'?window:globalThis);

(function(root){
  'use strict';
  const PS=root.PS=root.PS||{},G=PS.G,A=PS.A;
  const te=typeof TextEncoder!=='undefined'?new TextEncoder():null;

  function u8(data){if(data instanceof Uint8Array)return data;if(data instanceof ArrayBuffer)return new Uint8Array(data);return te.encode(String(data));}
  function concat(arrs){let n=0;arrs.forEach(a=>n+=a.length);const out=new Uint8Array(n);let o=0;arrs.forEach(a=>{out.set(a,o);o+=a.length;});return out;}
  function le16(n){return new Uint8Array([n&255,(n>>>8)&255]);}
  function le32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);}
  const CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let i=0;i<256;i++){let c=i;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[i]=c>>>0;}return t;})();
  function crc32(bytes){let c=0xffffffff;for(let i=0;i<bytes.length;i++)c=CRC_TABLE[(c^bytes[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  function dosDateTime(date){date=date||new Date();const time=(date.getHours()<<11)|(date.getMinutes()<<5)|(date.getSeconds()>>1),d=((date.getFullYear()-1980)<<9)|((date.getMonth()+1)<<5)|date.getDate();return{time,date:d};}
  function makeZip(entries){
    const locals=[],centrals=[];let offset=0;const dt=dosDateTime();
    entries.forEach(e=>{const name=u8(e.name),data=u8(e.data),crc=crc32(data),lh=concat([le32(0x04034b50),le16(20),le16(0),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),name]);locals.push(lh,data);const ch=concat([le32(0x02014b50),le16(20),le16(20),le16(0),le16(0),le16(dt.time),le16(dt.date),le32(crc),le32(data.length),le32(data.length),le16(name.length),le16(0),le16(0),le16(0),le16(0),le32(0),le32(offset),name]);centrals.push(ch);offset+=lh.length+data.length;});
    const central=concat(centrals),local=concat(locals),end=concat([le32(0x06054b50),le16(0),le16(0),le16(entries.length),le16(entries.length),le32(central.length),le32(local.length),le16(0)]);return concat([local,central,end]);
  }
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
  function color8(hex){let h=String(hex||'#cccccc').replace('#','');if(h.length===3)h=h.split('').map(x=>x+x).join('');return '#'+h.toUpperCase()+'FF';}
  function zUpVertex(x,y,z){return[x,-z,y];}

  function binarySTL(meshes,name){
    let tris=0;meshes.forEach(m=>tris+=m.indices.length/3);const buf=new ArrayBuffer(84+tris*50),dv=new DataView(buf);const hdr=`PurseStudio ${PS.APP_VERSION} ${name||''}`;for(let i=0;i<Math.min(80,hdr.length);i++)dv.setUint8(i,hdr.charCodeAt(i));dv.setUint32(80,tris,true);let off=84;
    meshes.forEach(m=>{for(let k=0;k<m.indices.length;k+=3){const p=[G.vget(m,m.indices[k]),G.vget(m,m.indices[k+1]),G.vget(m,m.indices[k+2])].map(q=>zUpVertex(q[0],q[1],q[2]));const u=[p[1][0]-p[0][0],p[1][1]-p[0][1],p[1][2]-p[0][2]],v=[p[2][0]-p[0][0],p[2][1]-p[0][1],p[2][2]-p[0][2]];let nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0],l=Math.hypot(nx,ny,nz)||1;[nx,ny,nz]=[nx/l,ny/l,nz/l];[nx,ny,nz].forEach((q,i)=>dv.setFloat32(off+i*4,q,true));let o=off+12;p.forEach(pt=>pt.forEach(q=>{dv.setFloat32(o,q,true);o+=4;}));dv.setUint16(off+48,0,true);off+=50;}});return new Uint8Array(buf);
  }

  function printablePlateMeshes(state,plan,plateIndex){
    const plate=plan.plates[plateIndex],out=[];if(!plate)return out;
    for(const item of plate.items){
      const src=item.rect.printableMeshes||G.orientPrintableGroup(item.rect.name,item.rect.meshes);
      let group=src.map(G.cloneMesh);
      const rotDeg=item.rotationDeg!=null?item.rotationDeg:(item.rotated?90:0);
      if(rotDeg){
        const rad=rotDeg*Math.PI/180;
        group=group.map(m=>G.rotateYMesh(m,rad,[0,0,0],m.name));
      }
      const rb=G.groupBounds(group);
      const dx=-state.printer.bedX/2+item.x+item.w/2-(rb.min[0]+rb.max[0])/2;
      const dz=-state.printer.bedY/2+item.y+item.h/2-(rb.min[2]+rb.max[2])/2;
      group=group.map(m=>G.translateMesh(m,dx,-rb.min[1],dz,m.name));
      out.push(...group);
    }
    return out;
  }

  function preparePrintableSTLGroup(state,meshes,label,forcedRotationDeg){
    let oriented=G.orientPrintableGroup(label,meshes);
    let rotDeg=forcedRotationDeg;
    if(rotDeg==null&&state&&state.printer){
      const fit=A.findOptimalBedRotation(oriented,state.printer.bedX,state.printer.bedY,Math.min(state.layout?.spacing??8,4));
      if(fit.fits&&fit.diagonal&&fit.angleDeg>0) rotDeg=fit.angleDeg;
    }
    if(rotDeg){
      const rad=rotDeg*Math.PI/180;
      oriented=oriented.map(m=>G.rotateYMesh(m,rad,[0,0,0],m.name));
      const rb=G.groupBounds(oriented);
      oriented=oriented.map(m=>G.translateMesh(m,-(rb.min[0]+rb.max[0])/2,-rb.min[1],-(rb.min[2]+rb.max[2])/2,m.name));
    }
    return oriented;
  }

  function build3MF(state,meshes,title,notes){
    const colors=[],colorMap=new Map();function matId(hex){const h=color8(hex);if(!colorMap.has(h)){colorMap.set(h,colors.length);colors.push(h);}return colorMap.get(h);}
    meshes.forEach(m=>matId(m.color));
    let resources=`<basematerials id="1">${colors.map((c,i)=>`<base name="Material_${i+1}" displaycolor="${c}"/>`).join('')}</basematerials>`;let build='';let id=2;
    meshes.forEach((m)=>{const welded=A.weldMesh(m,1e-5),verts=[];for(let i=0;i<welded.positions.length;i+=3){const p=zUpVertex(welded.positions[i],welded.positions[i+1],welded.positions[i+2]);verts.push(`<vertex x="${p[0].toFixed(4)}" y="${p[1].toFixed(4)}" z="${p[2].toFixed(4)}"/>`);}const mid=matId(m.color);const ts=[];for(let k=0;k<welded.indices.length;k+=3)ts.push(`<triangle v1="${welded.indices[k]}" v2="${welded.indices[k+1]}" v3="${welded.indices[k+2]}" pid="1" p1="${mid}"/>`);resources+=`<object id="${id}" type="model" name="${esc(m.name)}"><mesh><vertices>${verts.join('')}</vertices><triangles>${ts.join('')}</triangles></mesh></object>`;build+=`<item objectid="${id}"/>`;id++;});
    const meta=`<metadata name="Title">${esc(title||state.metadata.projectName)}</metadata><metadata name="Designer">Purse Studio ${PS.APP_VERSION}</metadata><metadata name="Description">${esc(notes||'Parametric purse project')}</metadata>`;
    const model=`<?xml version="1.0" encoding="UTF-8"?><model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">${meta}<resources>${resources}</resources><build>${build}</build></model>`;
    const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>`;
    const types=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="json" ContentType="application/json"/><Default Extension="txt" ContentType="text/plain"/></Types>`;
    const process={generator:`Purse Studio ${PS.APP_VERSION}`,printer:state.printer,material:state.material,calibration:state.calibration,fuzzySkin:state.surface.fuzzy,warning:'Slicer-specific fuzzy-skin settings are advisory metadata. Enable fuzzy skin in your slicer unless baked geometry was selected.'};
    return makeZip([{name:'[Content_Types].xml',data:types},{name:'_rels/.rels',data:rels},{name:'3D/3dmodel.model',data:model},{name:'Metadata/process.json',data:JSON.stringify(process,null,2)},{name:'Metadata/README.txt',data:'This is a standards-based 3MF generated by Purse Studio. Multi-plate projects are exported as one 3MF per plate inside a ZIP bundle so plate boundaries are unambiguous across slicers.'}]);
  }

  function plateBundle(state,analysis){
    const entries=[];for(let i=0;i<analysis.plates.plates.length;i++){const meshes=printablePlateMeshes(state,analysis.plates,i),data=build3MF(state,meshes,`${state.metadata.projectName} - Plate ${i+1}`,`Plate ${i+1} of ${analysis.plates.plates.length}`);entries.push({name:`Plate_${i+1}.3mf`,data});}
    entries.push({name:'README.txt',data:`${state.metadata.projectName}\nGenerated by Purse Studio ${PS.APP_VERSION}\n\nEach plate is a separate standards-based 3MF for reliable import across slicers.\nMaterial: ${PS.MATERIALS[state.material]?.label||state.material}\nRecommended moving gap: ${state.calibration.movingGap} mm\nFuzzy skin: ${state.surface.fuzzy.mode}\n`});return makeZip(entries);
  }

  function projectFile(state,previewDataUrl){const payload={format:'PurseStudioProject',schemaVersion:PS.SCHEMA_VERSION,appVersion:PS.APP_VERSION,savedAt:new Date().toISOString(),state,assets:{logoDataUrl:state.personalization.logoDataUrl||null,patternDataUrl:state.surface.customPattern.dataUrl||null,previewDataUrl:previewDataUrl||null}};return u8(JSON.stringify(payload,null,2));}
  function parseProject(text){const p=typeof text==='string'?JSON.parse(text):text;if(p&&p.format==='PurseStudioProject'&&p.state){if(p.assets?.logoDataUrl)p.state.personalization.logoDataUrl=p.assets.logoDataUrl;if(p.assets?.patternDataUrl)p.state.surface.customPattern.dataUrl=p.assets.patternDataUrl;return PS.migrateState(p.state);}return PS.migrateState(p);}

  function downloadBlob(data,filename,type){if(typeof document==='undefined')return;const blob=data instanceof Blob?data:new Blob([data],{type:type||'application/octet-stream'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function safeName(s){return String(s||'purse').trim().replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,60)||'purse';}
  function exportPlate3MF(state,analysis,plateIndex){const meshes=printablePlateMeshes(state,analysis.plates,plateIndex),data=build3MF(state,meshes,`${state.metadata.projectName} - Plate ${plateIndex+1}`);downloadBlob(data,`${safeName(state.metadata.projectName)}_plate_${plateIndex+1}.3mf`,'application/vnd.ms-package.3dmanufacturing-3dmodel+xml');}
  function exportBundle(state,analysis){const data=plateBundle(state,analysis);downloadBlob(data,`${safeName(state.metadata.projectName)}_all_plates.zip`,'application/zip');}
  function exportSTL(state,meshes,label,forcedRotationDeg){const oriented=preparePrintableSTLGroup(state,meshes,label,forcedRotationDeg),data=binarySTL(oriented,label);downloadBlob(data,`${safeName(state.metadata.projectName)}_${safeName(label)}.stl`,'application/octet-stream');}
  function saveProject(state,previewDataUrl){downloadBlob(projectFile(state,previewDataUrl),`${safeName(state.metadata.projectName)}.purse`,'application/json');}

  PS.E={u8,crc32,makeZip,binarySTL,printablePlateMeshes,preparePrintableSTLGroup,build3MF,plateBundle,projectFile,parseProject,downloadBlob,safeName,exportPlate3MF,exportBundle,exportSTL,saveProject};
})(typeof window!=='undefined'?window:globalThis);
