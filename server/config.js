// Central configuration. Secrets/settings come from environment variables (see .env.example).
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '..');

try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* .env is optional */ }

const num = (v, d) => (Number.isFinite(Number(v)) && v !== undefined && v !== '' ? Number(v) : d);

export const cfg = {
  port: num(process.env.PORT, 3001),
  production: process.env.NODE_ENV === 'production',
  // SQLite file + private payment screenshots live here. NEVER serve this folder publicly.
  dataDir: path.resolve(process.env.DATA_DIR || path.join(here, 'data')),
  orderRateLimit: num(process.env.ORDER_RATE_LIMIT, 20), // max new orders per IP per hour
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 5),
  // set TRUST_PROXY=1 when running behind nginx / a PaaS load balancer so client IPs are read correctly
  trustProxy: process.env.TRUST_PROXY === '1',
  // public https address of this site (e.g. your Cloudflare Tunnel URL). Used for the screenshot link in WhatsApp. Empty = taken from the request.
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  distDir: process.env.DIST_DIR ? path.resolve(process.env.DIST_DIR) : path.join(ROOT, 'dist'),
};

// Single source of truth for business details: the existing website data file (WhatsApp number, phone, branches...).
const site = await import(pathToFileURL(path.join(ROOT, 'src/data/site.js')).href);
export const SITE = site.SITE;
export const BRANCHES = site.BRANCHES;
export const ORDER_OPTIONS = site.ORDER_OPTIONS;
export const CAKE_PRICING = site.CAKE_PRICING;
