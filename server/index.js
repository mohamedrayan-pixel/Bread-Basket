import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { cfg, SITE, CAKE_PRICING } from './config.js';
import './db.js';
import { HttpError, readJson, readBody, parseMultipart, send, clientIp, rateLimit } from './http-utils.js';
import * as O from './orders.js';
import { buildBillPdf } from './bill.js';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };

const SEC = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-src https://www.google.com; connect-src 'self'; script-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

/** Public address used inside WhatsApp links (screenshot URL). Set PUBLIC_BASE_URL when using a tunnel / domain. */
const originOf = (req) => cfg.publicBaseUrl || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}`;

const R = (method, pattern, handler) => ({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler });
const routes = [
  R('GET', '/api/config', () => ({ json: { pricing: CAKE_PRICING, upi: SITE.upi, maxUploadMb: cfg.maxUploadMb } })),
  R('POST', '/api/orders', async (req) => {
    rateLimit(`order:${clientIp(req)}`, cfg.orderRateLimit, 3600_000);
    const body = await readJson(req);
    const r = O.createOrder(body, req.headers['idempotency-key'] || body.requestKey);
    return { status: r.duplicate ? 200 : 201, json: { orderId: r.orderId, token: r.token } };
  }),
  R('POST', '/api/track', async (req) => {
    rateLimit(`track:${clientIp(req)}`, 10, 15 * 60_000);
    const b = await readJson(req); return { json: O.trackOrder(b.orderId, b.phone) };
  }),
  R('GET', '/api/orders/:token', (req, { token }) => ({ json: O.getPublicOrder(token, originOf(req)) })),
  R('POST', '/api/orders/:token/payment', async (req, { token }) => {
    rateLimit(`pay:${clientIp(req)}`, 30, 3600_000);
    const buf = await readBody(req, (cfg.maxUploadMb + 1) * 1024 * 1024);
    const { fields, files } = parseMultipart(buf, req.headers['content-type']);
    return { json: O.submitPayment(token, { utr: fields.utr, file: files.screenshot }, originOf(req)) };
  }),
  R('GET', '/api/proof/:file', (req, { file }) => {
    rateLimit(`proof:${clientIp(req)}`, 120, 3600_000);
    const s = O.proofFile(file);
    return { raw: s.data, headers: { 'Content-Type': s.mime, 'Content-Disposition': 'inline', 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } };
  }),
  R('POST', '/api/orders/:token/whatsapp-opened', (req, { token }) => ({ json: O.markWhatsappOpened(token) })),
  R('GET', '/api/orders/:token/bill.pdf', (req, { token }) => billResponse(O.orderByToken(token))),
];

function billResponse(order) {
  const { o, pay } = O.billableOrder(order);
  return { raw: buildBillPdf(o, pay), headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Bill-${o.bill_no}.pdf"` } };
}

function serveStatic(req, res, pathname) {
  if (!fs.existsSync(cfg.distDir)) return send(res, 404, 'Frontend not built yet. Run "npm run build" (or use "npm run dev" with the Vite dev server).', SEC);
  let file = path.join(cfg.distDir, decodeURIComponent(pathname));
  if (!file.startsWith(cfg.distDir + path.sep) && file !== cfg.distDir) return send(res, 403, 'Forbidden', SEC);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (path.extname(pathname)) return send(res, 404, 'Not found', SEC);
    file = path.join(cfg.distDir, 'index.html'); // SPA fallback (/admin, /order/<token>)
  }
  const ext = path.extname(file).toLowerCase();
  const immutable = file.includes(`${path.sep}assets${path.sep}`);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache', ...SEC });
  fs.createReadStream(file).pipe(res);
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) {
      for (const r of routes) {
        if (r.method !== req.method) continue;
        const m = r.re.exec(url.pathname); if (!m) continue;
        const out = await r.handler(req, m.groups || {}, url);
        if (out.raw) return (res.writeHead(out.status || 200, { 'X-Content-Type-Options': 'nosniff', ...out.headers, ...SEC, 'Content-Security-Policy': "default-src 'none'" }), res.end(out.raw));
        return send(res, out.status || 200, out.json, { ...SEC, ...(out.headers || {}) });
      }
      throw new HttpError(404, 'Not found.');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Method not allowed.');
    serveStatic(req, res, url.pathname);
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.extra }, SEC);
    console.error('Unhandled error:', e);
    send(res, 500, { error: 'Something went wrong. Please try again.' }, SEC);
  }
});

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  server.listen(cfg.port, () => {
    console.log(`The Bread Basket server listening on http://localhost:${cfg.port}`);
  });
}
