import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const DATA_DIR = path.join(ROOT, 'data');
const STORE_PATH = path.join(DATA_DIR, 'boutique-management-store.json');
const PORT = Number(process.env.PORT || 5174);
const HOST = process.env.HOST || '0.0.0.0';

// Default salted SHA-256 hash (no plaintext password stored)
const DEFAULT_PASS_HASH = '3c381a46fd55d95fc6fff6efb79356a1d9f0a2a0d587152a8968e12586646804';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv; charset=utf-8',
};

function readStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    }
  } catch {}
  return {
    passHash: DEFAULT_PASS_HASH,
    orders: [],
    requests: [],
    invOverrides: { items: {}, customProducts: [] },
    queueOverrides: { updates: {}, added: [] },
  };
}

function writeStore(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const parsed = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsed.pathname);

  // API: Customer submits Boutique Bag Checkout Order (works from any customer phone!)
  if (req.method === 'POST' && pathname === '/api/orders') {
    try {
      const order = await readJsonBody(req);
      if (!order || !order.orderNumber) return sendJson(res, 400, { error: 'Invalid order' });
      const store = readStore();
      store.orders = [order, ...store.orders.filter((o) => o.orderNumber !== order.orderNumber)].slice(0, 250);
      writeStore(store);
      return sendJson(res, 200, { ok: true, orderNumber: order.orderNumber });
    } catch {
      return sendJson(res, 400, { error: 'Bad request' });
    }
  }

  // API: Customer submits Custom Design Request (works from any customer phone!)
  if (req.method === 'POST' && pathname === '/api/custom-requests') {
    try {
      const customReq = await readJsonBody(req);
      if (!customReq || !customReq.referenceId) return sendJson(res, 400, { error: 'Invalid request' });
      const store = readStore();
      store.requests = [customReq, ...store.requests.filter((r) => r.referenceId !== customReq.referenceId)].slice(0, 250);
      writeStore(store);
      return sendJson(res, 200, { ok: true, referenceId: customReq.referenceId });
    } catch {
      return sendJson(res, 400, { error: 'Bad request' });
    }
  }

  // API: Verify Management Passcode Hash
  if (req.method === 'POST' && pathname === '/api/manage/verify') {
    try {
      const body = await readJsonBody(req);
      const store = readStore();
      const expected = store.passHash || DEFAULT_PASS_HASH;
      return sendJson(res, 200, { ok: Boolean(body && body.hash === expected) });
    } catch {
      return sendJson(res, 400, { ok: false });
    }
  }

  // API: Protected Management State GET / POST
  if (pathname === '/api/manage/state') {
    const store = readStore();
    const expected = store.passHash || DEFAULT_PASS_HASH;
    const provided = String(req.headers['x-manage-auth'] || '');
    if (!provided || provided !== expected) {
      return sendJson(res, 401, { error: 'Unauthorized' });
    }
    if (req.method === 'GET') {
      return sendJson(res, 200, {
        orders: store.orders || [],
        requests: store.requests || [],
        invOverrides: store.invOverrides || { items: {}, customProducts: [] },
        queueOverrides: store.queueOverrides || { updates: {}, added: [] },
      });
    }
    if (req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        if (Array.isArray(body.orders)) store.orders = body.orders;
        if (Array.isArray(body.requests)) store.requests = body.requests;
        if (body.invOverrides) store.invOverrides = body.invOverrides;
        if (body.queueOverrides) store.queueOverrides = body.queueOverrides;
        if (typeof body.passHash === 'string' && /^[a-f0-9]{64}$/i.test(body.passHash)) {
          store.passHash = body.passHash.toLowerCase();
        }
        writeStore(store);
        return sendJson(res, 200, { ok: true });
      } catch {
        return sendJson(res, 400, { error: 'Invalid payload' });
      }
    }
  }

  // Static file serving from dist/
  let rel = pathname.replace(/^\/+/, '');
  if (!rel || rel.endsWith('/')) rel += 'index.html';
  let filePath = path.resolve(DIST_DIR, rel);
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    // Only SPA-fallback non-file root paths, never missing studio/manage/api paths
    if (!pathname.startsWith('/api/') && !path.extname(pathname)) {
      filePath = path.join(DIST_DIR, 'index.html');
    } else {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=3600',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`Maison 704 Boutique + Management Server listening on http://${HOST}:${PORT}`);
});
