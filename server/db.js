import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { cfg } from './config.js';

fs.mkdirSync(path.join(cfg.dataDir, 'uploads'), { recursive: true });
export const UPLOAD_DIR = path.join(cfg.dataDir, 'uploads');
export const db = new DatabaseSync(path.join(cfg.dataDir, 'bread-basket.db'));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  bill_no TEXT UNIQUE,
  access_token TEXT NOT NULL UNIQUE,
  idem_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL, phone TEXT NOT NULL, address TEXT,
  occasion TEXT NOT NULL, flavour TEXT NOT NULL, size TEXT NOT NULL,
  design TEXT, notes TEXT, quantity INTEGER NOT NULL,
  order_type TEXT NOT NULL, pickup_branch TEXT, pref_date TEXT NOT NULL, pref_time TEXT NOT NULL,
  unit_price INTEGER NOT NULL, subtotal INTEGER NOT NULL, delivery_charge INTEGER NOT NULL, total INTEGER NOT NULL,
  pricing_confirmed INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL, order_status TEXT NOT NULL,
  created_at TEXT NOT NULL, approved_at TEXT, approved_by TEXT,
  bill_generated_at TEXT, whatsapp_opened_at TEXT
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_pk INTEGER NOT NULL REFERENCES orders(id),
  utr TEXT NOT NULL, screenshot_file TEXT NOT NULL, screenshot_mime TEXT NOT NULL,
  amount INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING',
  submitted_at TEXT NOT NULL, decided_by TEXT, decided_at TEXT, reject_reason TEXT
);
CREATE INDEX IF NOT EXISTS payments_order ON payments(order_pk);
CREATE INDEX IF NOT EXISTS payments_utr ON payments(utr);
CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_pk INTEGER NOT NULL REFERENCES orders(id),
  status TEXT NOT NULL, note TEXT, actor TEXT NOT NULL, at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
`);

/** Run fn inside a write transaction (BEGIN IMMEDIATE serialises writers, so counters are collision-safe). */
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; }
}

/** Next number of a named counter, e.g. next('ORDER-2026') -> 1, 2, 3... Must be called inside tx(). */
export function nextSeq(key) {
  db.prepare('INSERT INTO counters(key,value) VALUES(?,0) ON CONFLICT(key) DO NOTHING').run(key);
  db.prepare('UPDATE counters SET value = value + 1 WHERE key = ?').run(key);
  return db.prepare('SELECT value FROM counters WHERE key = ?').get(key).value;
}

export const pad = (n) => String(n).padStart(6, '0');
