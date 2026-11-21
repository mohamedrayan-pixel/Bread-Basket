import { cfg } from './config.js';

export class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; }
}

export async function readBody(req, limit) {
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > limit) throw new HttpError(413, 'Request is too large.');
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new HttpError(413, 'Request is too large.');
    chunks.push(c);
  }
  return Buffer.concat(chunks);
}

export async function readJson(req, limit = 64 * 1024) {
  const ct = req.headers['content-type'] || '';
  if (!ct.includes('application/json')) throw new HttpError(415, 'Expected application/json.');
  try { return JSON.parse((await readBody(req, limit)).toString('utf8') || '{}'); }
  catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(400, 'Invalid JSON.'); }
}

/** Minimal multipart/form-data parser: returns { fields, files } (files hold raw Buffers). */
export function parseMultipart(buf, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) throw new HttpError(400, 'Invalid multipart request.');
  const boundary = Buffer.from('--' + (m[1] || m[2]).trim());
  const fields = {}; const files = {};
  let pos = buf.indexOf(boundary);
  while (pos !== -1) {
    pos += boundary.length;
    if (buf.slice(pos, pos + 2).toString() === '--') break;
    pos += 2; // CRLF after boundary
    const headEnd = buf.indexOf('\r\n\r\n', pos);
    if (headEnd === -1) break;
    const head = buf.slice(pos, headEnd).toString('utf8');
    const next = buf.indexOf(Buffer.concat([Buffer.from('\r\n'), boundary]), headEnd + 4);
    if (next === -1) break;
    const data = buf.slice(headEnd + 4, next);
    const name = /name="([^"]*)"/i.exec(head)?.[1];
    const filename = /filename="([^"]*)"/i.exec(head)?.[1];
    if (name) {
      if (filename !== undefined) files[name] = { filename, data };
      else fields[name] = data.toString('utf8');
    }
    pos = next + 2;
  }
  return { fields, files };
}

/** Identify an image from its first bytes (never trust the client's filename / Content-Type). */
export function sniffImage(b) {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (b.length > 12 && b.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (b.length > 12 && b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

export function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const payload = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': isBuf || typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(payload);
}

export function clientIp(req) {
  if (cfg.trustProxy) { const f = req.headers['x-forwarded-for']; if (f) return String(f).split(',')[0].trim(); }
  return req.socket.remoteAddress || 'unknown';
}

/** Tiny in-memory fixed-window rate limiter (per process). */
const buckets = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now(); const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return; }
  if (++b.n > max) throw new HttpError(429, 'Too many attempts. Please wait a while and try again.');
}
export function rateLimitHits(key) { const b = buckets.get(key); return b && b.reset > Date.now() ? b.n : 0; }
setInterval(() => { const n = Date.now(); for (const [k, v] of buckets) if (v.reset < n) buckets.delete(k); }, 60_000).unref();

export function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || '').split(';')) {
    const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
