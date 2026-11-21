import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db, tx, nextSeq, pad, UPLOAD_DIR } from './db.js';
import { cfg, SITE, ORDER_OPTIONS as OPT } from './config.js';
import { HttpError, sniffImage } from './http-utils.js';
import { priceOrder } from './pricing.js';
import { validateOrder, sizeLabel, fmtDate, fmtTime } from '../src/utils/order.js';

export const MAX_PAYMENT_ATTEMPTS = 5;
/** Plain 10-digit mobile number: drops spaces/dashes and a +91 / 91 country code only when it is a prefix of a 12-digit number. */
export const normPhone = (v) => { const d = String(v ?? '').replace(/[\s-]/g, ''); return /^\+?91[6-9]\d{9}$/.test(d) ? d.replace(/^\+?91/, '') : d; };
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max);

/** A Date whose *local* fields equal the current wall-clock time in India, so the shared validator works on any server TZ. */
function istWallClock(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d).map((x) => [x.type, x.value]));
  return new Date(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute));
}
export const istYear = (d = new Date()) => istWallClock(d).getFullYear();

const history = (pk, status, actor, note = null) =>
  db.prepare('INSERT INTO order_history(order_pk,status,note,actor,at) VALUES(?,?,?,?,?)').run(pk, status, note, actor, new Date().toISOString());

// ---------- create ----------
export function createOrder(input, idemKey) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(String(idemKey || ''))) throw new HttpError(400, 'Missing request key. Please refresh and try again.');
  const existing = db.prepare('SELECT order_id, access_token FROM orders WHERE idem_key = ?').get(idemKey);
  if (existing) return { orderId: existing.order_id, token: existing.access_token, duplicate: true };

  const v = {
    name: clean(input.name, 80), phone: clean(input.phone, 20), occasion: clean(input.occasion, 40),
    flavour: clean(input.flavour, 60), size: clean(input.size, 20), customKg: clean(input.customKg, 6), design: clean(input.design, 1000), notes: clean(input.notes, 1000),
    quantity: Number(input.quantity), date: clean(input.date, 10), time: clean(input.time, 5), branch: clean(input.branch, 40),
  };
  const errs = validateOrder({ ...v, type: 'Store Pickup' }, istWallClock());
  if (v.occasion && !OPT.occasions.includes(v.occasion)) errs.occasion = 'Invalid occasion.';
  if (v.flavour && !OPT.flavours.includes(v.flavour)) errs.flavour = 'Invalid flavour.';
  if (v.size && !OPT.sizes.includes(v.size)) errs.size = 'Invalid size.';
  if (v.branch && !OPT.branches.includes(v.branch)) errs.branch = 'Invalid branch.';
  if (Object.keys(errs).length) throw new HttpError(422, 'Please correct the highlighted fields.', { fields: errs });

  const price = priceOrder({ size: v.size, customKg: v.customKg, flavour: v.flavour, quantity: v.quantity });
  if (price.error) throw new HttpError(422, 'We could not calculate the price for this order. Please check the weight and quantity.');
  const sizeText = sizeLabel(v.size, v.customKg); // custom weights are stored as e.g. "2.3kg"

  const phone = normPhone(v.phone);
  const token = crypto.randomBytes(24).toString('base64url');
  const now = new Date();
  return tx(() => {
    const dup = db.prepare('SELECT order_id, access_token FROM orders WHERE idem_key = ?').get(idemKey);
    if (dup) return { orderId: dup.order_id, token: dup.access_token, duplicate: true };
    const orderId = `BB-${istYear(now)}-${pad(nextSeq(`ORDER-${istYear(now)}`))}`;
    const r = db.prepare(`INSERT INTO orders(order_id,access_token,idem_key,name,phone,address,occasion,flavour,size,design,notes,quantity,order_type,pickup_branch,pref_date,pref_time,
      unit_price,subtotal,delivery_charge,total,pricing_confirmed,payment_status,order_status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(orderId, token, idemKey, v.name, phone, null, v.occasion, v.flavour, sizeText, v.design, v.notes, v.quantity, 'Store Pickup',
        v.branch, v.date, v.time, price.unit, price.subtotal, 0, price.total, 1,
        'PENDING_PAYMENT', 'PLACED', now.toISOString());
    history(r.lastInsertRowid, 'PENDING_PAYMENT', 'customer', 'Order placed');
    return { orderId, token, duplicate: false };
  });
}

// ---------- reads ----------
const byToken = (t) => db.prepare('SELECT * FROM orders WHERE access_token = ?').get(String(t || ''));
const byOrderId = (id) => db.prepare('SELECT * FROM orders WHERE order_id = ?').get(String(id || ''));
const latestPayment = (pk) => db.prepare('SELECT * FROM payments WHERE order_pk = ? ORDER BY id DESC LIMIT 1').get(pk);

export const proofUrl = (origin, pay) => (pay ? `${origin}/api/proof/${pay.screenshot_file}` : null);

export function buildWhatsappMessage(o, pay, origin = '') {
  const dash = (x) => (x && String(x).trim() ? String(x).trim() : '-');
  return [
    'THE BREAD BASKET - CAKE ORDER CONFIRMATION', '',
    `Order Reference: ${o.order_id}`, `Bill Number: ${o.bill_no}`, '',
    `Customer Name: ${o.name}`, `Mobile Number: ${o.phone}`, '',
    `Cake Flavour: ${o.flavour}`, `Cake Weight: ${o.size}`, `Quantity: ${o.quantity}`, `Occasion: ${o.occasion}`,
    `Cake Design / Customization: ${dash(o.design)}`, `Additional Instructions: ${dash(o.notes)}`, '',
    'Order Type: Store Pickup', `Pickup Branch: ${dash(o.pickup_branch)}`,
    `Pickup Date: ${fmtDate(o.pref_date)}`, `Pickup Time: ${fmtTime(o.pref_time)}`, '',
    `Total Amount: Rs. ${o.total}`, `UTR / Transaction ID: ${pay?.utr || '-'}`,
    'Payment Status: Payment Verification Pending', '',
    `Bill: ${origin}/api/orders/${o.access_token}/bill.pdf`,
    `Payment Screenshot: ${proofUrl(origin, pay) || '-'}`, '',
    'Please verify my payment and confirm my order.',
  ].join('\n');
}

/** What the customer may see. Internal fields (admin names, file names, tokens) are never included. */
export function publicOrder(o, origin = '') {
  const pay = latestPayment(o.id);
  const submitted = o.payment_status === 'PAYMENT_VERIFICATION_PENDING';
  const out = {
    orderId: o.order_id, billNo: submitted ? o.bill_no : null,
    name: o.name, phone: o.phone, address: o.address, occasion: o.occasion, flavour: o.flavour, size: o.size, design: o.design, notes: o.notes,
    quantity: o.quantity, orderType: o.order_type, pickupBranch: o.pickup_branch, date: o.pref_date, time: o.pref_time,
    unitPrice: o.unit_price, subtotal: o.subtotal, deliveryCharge: o.delivery_charge, total: o.total, pricingConfirmed: !!o.pricing_confirmed,
    paymentStatus: o.payment_status, orderStatus: o.order_status, createdAt: o.created_at, approvedAt: o.approved_at,
    attemptsLeft: Math.max(0, MAX_PAYMENT_ATTEMPTS - db.prepare('SELECT COUNT(*) c FROM payments WHERE order_pk = ?').get(o.id).c),
    payment: pay ? { utr: pay.utr, amount: pay.amount, submittedAt: pay.submitted_at, status: pay.status, rejectReason: pay.status === 'REJECTED' ? pay.reject_reason : null } : null,
    whatsapp: null,
  };
  if (submitted) {
    out.whatsapp = { url: `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(buildWhatsappMessage(o, pay, origin))}`, alreadyOpened: !!o.whatsapp_opened_at };
  }
  return out;
}

export const getPublicOrder = (token, origin) => { const o = byToken(token); if (!o) throw new HttpError(404, 'Order not found.'); return publicOrder(o, origin); };

export function trackOrder(orderId, phone) {
  const o = byOrderId(String(orderId || '').trim().toUpperCase());
  const p = normPhone(phone);
  if (!o || o.phone !== p) throw new HttpError(404, 'We could not find an order with those details.');
  return { token: o.access_token };
}

// ---------- payment submission ----------
export function submitPayment(token, { utr, file }, origin = '') {
  const o = byToken(token);
  if (!o) throw new HttpError(404, 'Order not found.');
  if (o.payment_status !== 'PENDING_PAYMENT') throw new HttpError(409, 'Your payment details were already submitted and are awaiting verification.');
  const ref = clean(utr, 40).toUpperCase().replace(/\s/g, '');
  if (!/^[A-Z0-9]{8,30}$/.test(ref)) throw new HttpError(422, 'Enter the transaction ID / UTR exactly as shown in your payment app (8-30 letters or digits).', { fields: { utr: 'Invalid transaction ID.' } });
  if (!file || !file.data?.length) throw new HttpError(422, 'Please upload your payment screenshot.', { fields: { screenshot: 'Screenshot required.' } });
  if (file.data.length > cfg.maxUploadMb * 1024 * 1024) throw new HttpError(413, `Screenshot must be smaller than ${cfg.maxUploadMb} MB.`, { fields: { screenshot: 'Too large.' } });
  const kind = sniffImage(file.data);
  if (!kind) throw new HttpError(415, 'Only JPG, PNG or WEBP images are accepted.', { fields: { screenshot: 'Unsupported file type.' } });
  const used = db.prepare("SELECT 1 FROM payments p JOIN orders o ON o.id = p.order_pk WHERE p.utr = ? AND p.status IN ('PENDING','APPROVED') AND o.id != ?").get(ref, o.id);
  if (used) throw new HttpError(409, 'This transaction ID has already been used for another order. Please check it or contact us.', { fields: { utr: 'Already used.' } });

  const fname = `${crypto.randomBytes(20).toString('hex')}.${kind.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, fname), file.data, { mode: 0o600 });
  try {
    tx(() => {
      const cur = db.prepare('SELECT * FROM orders WHERE id = ?').get(o.id);
      if (cur.payment_status !== 'PENDING_PAYMENT') throw new HttpError(409, 'Your payment details were already submitted.');
      if (db.prepare('SELECT COUNT(*) c FROM payments WHERE order_pk = ?').get(o.id).c >= MAX_PAYMENT_ATTEMPTS) throw new HttpError(429, 'Maximum payment submissions reached. Please contact The Bread Basket.');
      const now = new Date();
      const pr = db.prepare('INSERT INTO payments(order_pk,utr,screenshot_file,screenshot_mime,amount,status,submitted_at) VALUES(?,?,?,?,?,?,?)')
        .run(o.id, ref, fname, kind.mime, cur.total, 'PENDING', now.toISOString()); // amount is the server-calculated total, never client input
      // Submitting a UTR + screenshot is NOT proof of payment. The order stays "Payment Verification Pending"
      // until the owner checks the payment manually (outside the website). Nothing here marks it paid.
      const bill = `BB-BILL-${istYear(now)}-${pad(nextSeq(`BILL-${istYear(now)}`))}`;
      db.prepare("UPDATE orders SET payment_status='PAYMENT_VERIFICATION_PENDING', order_status='PLACED', bill_no=?, bill_generated_at=? WHERE id = ?").run(bill, now.toISOString(), o.id);
      history(o.id, 'PAYMENT_VERIFICATION_PENDING', 'customer', `Payment proof submitted (ref ${ref}), bill ${bill}`);
    });
  } catch (e) { fs.rmSync(path.join(UPLOAD_DIR, fname), { force: true }); throw e; }
  return publicOrder(byToken(token), origin);
}

/** Screenshot for the shop's WhatsApp link. The file name is 160 random bits, so the link cannot be guessed. */
export function proofFile(name) {
  if (!/^[a-f0-9]{40}\.(jpg|png|webp)$/.test(String(name))) throw new HttpError(404, 'Not found.');
  const p = db.prepare('SELECT screenshot_mime FROM payments WHERE screenshot_file = ?').get(name);
  const file = path.join(UPLOAD_DIR, name);
  if (!p || !fs.existsSync(file)) throw new HttpError(404, 'Not found.');
  return { data: fs.readFileSync(file), mime: p.screenshot_mime };
}

// ---------- confirmed-order helpers ----------
export function markWhatsappOpened(token) {
  const r = db.prepare("UPDATE orders SET whatsapp_opened_at = ? WHERE access_token = ? AND payment_status = 'PAYMENT_VERIFICATION_PENDING' AND whatsapp_opened_at IS NULL").run(new Date().toISOString(), String(token || ''));
  return { first: r.changes === 1 };
}

export function billableOrder(o) {
  if (!o) throw new HttpError(404, 'Order not found.');
  if (o.payment_status !== 'PAYMENT_VERIFICATION_PENDING' || !o.bill_no) throw new HttpError(403, 'The bill is available after you submit your payment details.');
  return { o, pay: db.prepare('SELECT * FROM payments WHERE order_pk = ? ORDER BY id DESC LIMIT 1').get(o.id) };
}
export const orderByToken = byToken;
export const orderByOrderId = byOrderId;
