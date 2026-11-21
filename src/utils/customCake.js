// Frontend-only helpers for the /custom-cake order -> UPI payment -> invoice -> WhatsApp flow.
// Nothing here talks to a server. Pure functions where possible so they can be unit-tested.
import { SITE, waUrl } from '../data/site.js';
import { sizeLabel, totalPrice, weightKg, todayISO, fmtDate, fmtTime } from './order.js';

export const PAYMENT_STATUS = 'Awaiting manual verification';
export const PAYMENT_METHOD = 'UPI / Google Pay';
export const SHOT_MAX_MB = 5;
export const SHOT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const SEQ_KEY = 'bb_cc_seq';      // per-device daily counter used in the reference
const SESSION_KEY = 'bb_cc_session'; // the in-progress order (survives refresh, cleared when the tab closes)

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to keep references easy to read out
const randomCode = (n) => {
  const out = [];
  const buf = new Uint32Array(n);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(buf);
  else for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 2 ** 32);
  for (let i = 0; i < n; i++) out.push(ALPHABET[buf[i] % ALPHABET.length]);
  return out.join('');
};

/**
 * Readable, unique reference, e.g. BB-CAKE-20261121-001-7QK.
 * YYYYMMDD = today (IST-agnostic: device date), 001 = this device's order counter for the day,
 * 7QK = random suffix so two customers on different devices never get the same reference.
 */
export function newOrderRef(now = new Date()) {
  const day = todayISO(now).replace(/-/g, '');
  let n;
  try {
    const s = JSON.parse(localStorage.getItem(SEQ_KEY) || '{}');
    n = (s.day === day ? s.n : 0) + 1;
    localStorage.setItem(SEQ_KEY, JSON.stringify({ day, n }));
  } catch { n = 1 + Math.floor(Math.random() * 99); } // storage blocked: the random suffix still keeps it unique
  return `BB-CAKE-${day}-${String(n).padStart(3, '0')}-${randomCode(3)}`;
}

/** Immutable snapshot of a validated form: everything the payment screen, invoice and WhatsApp message need. */
export function buildOrder(v, ref, createdAt = new Date().toISOString()) {
  const price = totalPrice(v); // same pricing rules as the form (server/pricing is not used)
  return {
    ref, createdAt,
    name: v.name.trim(), phone: v.phone.trim(),
    occasion: v.occasion, flavour: v.flavour,
    size: sizeLabel(v.size, v.customKg), weightKg: weightKg(v.size, v.customKg),
    quantity: Number(v.quantity),
    design: v.design.trim(), notes: (v.notes || '').trim(),
    branch: v.branch, date: v.date, time: v.time,
    unit: price.unit, total: price.total,
  };
}

export const invoiceFileName = (ref) => `BreadBasket-${ref}.pdf`;

const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

/** The WhatsApp text. `status` = { invoice: boolean, screenshot: boolean }. */
export function buildWhatsAppMessage(o, status = {}) {
  return [
    '*THE BREAD BASKET – CUSTOM CAKE ORDER*',
    '',
    `Order Reference: ${o.ref}`,
    `Customer Name: ${o.name}`,
    `Customer Phone: ${o.phone}`,
    `Cake Type: Custom Cake (${o.occasion})`,
    `Cake Weight / Size: ${o.size}${o.quantity > 1 ? ` × ${o.quantity} cakes` : ''}`,
    `Flavour: ${o.flavour}`,
    `Customization / Design: ${o.design}`,
    `Additional Instructions: ${o.notes || 'None'}`,
    `Pickup Branch: ${o.branch} (store pickup)`,
    `Pickup Date & Time: ${fmtDate(o.date)}, ${fmtTime(o.time)}`,
    `Total Amount: ${money(o.total)}`,
    `Payment Method: ${PAYMENT_METHOD}`,
    `Payment Status: ${PAYMENT_STATUS} (customer-declared, not yet verified by the bakery)`,
    `Payment Screenshot: ${status.screenshot ? 'Selected on the website – will be attached in this chat' : 'To be attached in this chat'}`,
    `Invoice Generated: ${status.invoice ? 'Yes (downloaded by customer)' : 'Not downloaded yet'}`,
    '',
    'I have completed the UPI payment for my custom cake order. Please verify the payment and confirm my order. I will attach my payment screenshot to this WhatsApp conversation.',
  ].join('\n');
}

export const whatsAppLink = (o, status) => waUrl(buildWhatsAppMessage(o, status)); // https://wa.me/<SITE.whatsapp>?text=<encoded>

/** upi:// deep link for the "Pay with UPI app" button on phones. */
export const upiDeepLink = (o) => {
  const u = SITE.upi;
  return `upi://pay?pa=${encodeURIComponent(u.id)}&pn=${encodeURIComponent(u.payeeName)}&am=${o.total}&cu=INR&tn=${encodeURIComponent(o.ref)}`;
};

/** Validates a chosen screenshot. Returns an error message, or '' when fine. */
export function checkScreenshot(file) {
  if (!file) return 'Please choose an image.';
  if (!SHOT_TYPES.includes(file.type)) return 'Unsupported file. Please choose a JPG, JPEG, PNG or WEBP image.';
  if (file.size > SHOT_MAX_MB * 1024 * 1024) return `That image is ${(file.size / 1048576).toFixed(1)} MB. Please choose one smaller than ${SHOT_MAX_MB} MB.`;
  if (file.size === 0) return 'That file is empty. Please choose another image.';
  return '';
}

// ---- in-progress order kept in sessionStorage (the screenshot file itself is never stored) ----
export const saveSession = (data) => { try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* storage unavailable */ } };
export const clearSession = () => { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ } };
/** Restores the in-progress order only after a refresh / back-forward, never when arriving fresh from another page. */
export function loadSession() {
  try {
    const nav = performance.getEntriesByType?.('navigation')?.[0]?.type;
    if (nav !== 'reload' && nav !== 'back_forward') { clearSession(); return null; }
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    return s && s.order?.ref && s.values ? s : null;
  } catch { return null; }
}
