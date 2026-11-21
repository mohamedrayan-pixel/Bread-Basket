// Integration tests: run with  npm run test:server   (uses a throw-away database in a temp folder)
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-test-'));
process.env.DATA_DIR = tmp;
process.env.ORDER_RATE_LIMIT = '1000'; // the tests create many orders from one IP
const { server } = await import('./index.js');
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

let passed = 0;
const ok = (name) => { passed++; console.log('  ✓', name); };
const j = async (p, o = {}) => { const r = await fetch(base + p, o); const ct = r.headers.get('content-type') || ''; return { r, status: r.status, body: ct.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()) }; };
const post = (p, body, headers = {}) => j(p, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const tomorrow = () => { const d = new Date(Date.now() + 2 * 864e5); return d.toISOString().slice(0, 10); };
const order = (o = {}) => ({ name: 'Test Customer', phone: '9876543210', occasion: 'Birthday', flavour: 'Chocolate Truffle Cake', size: '1kg', quantity: 2, branch: 'Thillainagar', date: tomorrow(), time: '16:00', design: 'Blue theme, name: Riya', notes: 'TEST ORDER', ...o });
const key = () => 'k' + Math.random().toString(36).slice(2).padEnd(20, 'x');
const png = () => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(200, 7)]);
const pay = (token, utr, data = png(), extra = {}) => { const f = new FormData(); f.set('utr', utr); f.set('screenshot', new Blob([data]), 'shot.png'); for (const [k, v] of Object.entries(extra)) f.set(k, v); return j(`/api/orders/${token}/payment`, { method: 'POST', body: f }); };

console.log('Orders & pricing');
const k1 = key();
const a = await post('/api/orders', order(), { 'idempotency-key': k1 });
assert.equal(a.status, 201); assert.match(a.body.orderId, /^BB-\d{4}-000001$/); ok('order created with BB-YYYY-000001 id');
const a2 = await post('/api/orders', order(), { 'idempotency-key': k1 });
assert.equal(a2.body.orderId, a.body.orderId); assert.equal(a2.body.token, a.body.token); ok('same request key does not create a duplicate (refresh / double-click safe)');
const tok = a.body.token;
let v = await j(`/api/orders/${tok}`);
assert.equal(v.body.total, 1800); assert.equal(v.body.paymentStatus, 'PENDING_PAYMENT'); assert.equal(v.body.billNo, null); assert.equal(v.body.whatsapp, null); assert.equal(v.body.orderType, 'Store Pickup'); ok('server-calculated total (Rs 900/kg x 1kg x 2 = 1800); no bill / WhatsApp yet; pickup only');
const price = async (o) => (await j(`/api/orders/${(await post('/api/orders', order(o), { 'idempotency-key': key() })).body.token}`)).body;
assert.equal((await price({ flavour: 'Black Forest Cake', size: '500g', quantity: 1 })).total, 350); ok('Black Forest 500g = Rs 350');
assert.equal((await price({ flavour: 'White Forest Cake', size: '1kg', quantity: 1 })).total, 700); ok('White Forest 1kg = Rs 700 (double the 500g price)');
assert.equal((await price({ flavour: 'Red Velvet Cake', size: '500g', quantity: 1 })).total, 450); ok('fancy cake 500g = Rs 450 (Rs 900/kg)');
assert.equal((await price({ flavour: 'Mango Delight Cake', size: '2.5kg', quantity: 1 })).total, 2250); ok('2.5kg option is priced (Rs 2250)');
assert.equal((await price({ flavour: 'Lotus Biscoff Cake', size: '3kg', quantity: 3 })).total, 8100); ok('quantity multiplies the weight price (3kg x 3 = 8100)');
const cs = await price({ flavour: 'Chocolate Oreo Cake', size: 'Custom Size', customKg: '2.3', quantity: 1 });
assert.equal(cs.total, 2070); assert.equal(cs.size, '2.3kg'); ok('Custom Size priced automatically (2.3kg x Rs 900 = 2070, stored as 2.3kg)');
assert.equal((await price({ flavour: 'Black Forest Cake', size: 'Custom Size', customKg: '1.2', quantity: 1 })).total, 840); ok('Custom Size uses the Black Forest rate (1.2kg = 840)');
assert.equal((await post('/api/orders', order({ size: 'Custom Size', customKg: '' }), { 'idempotency-key': key() })).status, 422); ok('Custom Size without a weight rejected');
assert.equal((await post('/api/orders', order({ size: 'Custom Size', customKg: '0.2' }), { 'idempotency-key': key() })).status, 422); assert.equal((await post('/api/orders', order({ size: 'Custom Size', customKg: '50' }), { 'idempotency-key': key() })).status, 422); ok('Custom Size outside 0.5 - 10 kg rejected');
const tamper = await post('/api/orders', order({ total: 1, unitPrice: 1 }), { 'idempotency-key': key() });
assert.equal((await j(`/api/orders/${tamper.body.token}`)).body.total, 1800); ok('client-supplied total is ignored');
assert.equal((await post('/api/orders', order({ date: '2020-01-01' }), { 'idempotency-key': key() })).status, 422); ok('past date rejected');
assert.equal((await post('/api/orders', order({ time: '09:00' }), { 'idempotency-key': key() })).status, 422); assert.equal((await post('/api/orders', order({ time: '22:30' }), { 'idempotency-key': key() })).status, 422); ok('pickup time outside 10 AM - 10 PM rejected');
assert.equal((await post('/api/orders', order({ flavour: 'Hacked' }), { 'idempotency-key': key() })).status, 422); ok('unknown flavour rejected');
assert.equal((await post('/api/orders', order({ occasion: 'Wedding' }), { 'idempotency-key': key() })).status, 422); ok('only Birthday occasion accepted');
const hd = await post('/api/orders', order({ type: 'Home Delivery', address: '12 Some Street, Trichy' }), { 'idempotency-key': key() });
assert.equal((await j(`/api/orders/${hd.body.token}`)).body.orderType, 'Store Pickup'); assert.equal((await j(`/api/orders/${hd.body.token}`)).body.address, null); ok('home delivery cannot be requested (always store pickup)');
assert.equal((await post('/api/orders', order({ design: '' }), { 'idempotency-key': key() })).status, 422); ok('design / requirements required');
assert.equal((await post('/api/orders', order(), {})).status, 400); ok('missing request key rejected');
assert.equal((await j('/api/orders/nope')).status, 404); ok('unknown order token -> 404');

console.log('Customer cannot fake the flow');
assert.equal((await j(`/api/orders/${tok}/bill.pdf`)).status, 403); ok('bill refused before payment details are submitted');
assert.equal((await post(`/api/orders/${tok}/whatsapp-opened`, {})).body.first, false); ok('WhatsApp cannot be marked/opened before payment details');
assert.equal((await post(`/api/orders/${tok}`, { paymentStatus: 'PAID' })).status, 404); ok('no customer route can set PAID directly');

console.log('Payment submission (stays Payment Verification Pending)');
assert.equal((await pay(tok, 'UTR123456789', Buffer.from('not an image at all, just text'))).status, 415); ok('non-image upload rejected (checked by file signature)');
assert.equal((await pay(tok, 'UTR123456789', Buffer.concat([png(), Buffer.alloc(6 * 1024 * 1024)]))).status, 413); ok('oversize upload rejected');
assert.equal((await pay(tok, 'ab')).status, 422); ok('bad UTR rejected');
const nofile = new FormData(); nofile.set('utr', 'UTR123456789');
assert.equal((await j(`/api/orders/${tok}/payment`, { method: 'POST', body: nofile })).status, 422); ok('screenshot is mandatory');
const p1 = await pay(tok, 'utr 123456789012', png(), { amount: '1' });
assert.equal(p1.status, 200); assert.equal(p1.body.paymentStatus, 'PAYMENT_VERIFICATION_PENDING'); assert.notEqual(p1.body.paymentStatus, 'PAID'); assert.notEqual(p1.body.orderStatus, 'CONFIRMED'); assert.equal(p1.body.payment.amount, 1800); assert.equal(p1.body.payment.utr, 'UTR123456789012');
assert.match(p1.body.billNo, /^BB-BILL-\d{4}-000001$/); ok('UTR + screenshot -> Payment Verification Pending (never PAID) + bill; amount = server total');
const row = (await import('./db.js')).db.prepare("SELECT payment_status, order_status, approved_at, approved_by FROM orders WHERE order_id = ?").get(a.body.orderId);
assert.equal(row.payment_status, 'PAYMENT_VERIFICATION_PENDING'); assert.equal(row.approved_at, null); assert.equal(row.approved_by, null); ok('database row: pending, nothing auto-approved');
assert.equal((await pay(tok, 'UTR999999999999')).status, 409); ok('cannot submit payment twice for the same order');
const b = await post('/api/orders', order({ name: 'Second Customer', phone: '9123456780' }), { 'idempotency-key': key() });
assert.equal((await pay(b.body.token, 'UTR123456789012')).status, 409); ok('same UTR cannot be reused on another order');
assert.equal((await j('/uploads/anything.png')).status, 404); ok('uploads folder is not web-accessible');

console.log('WhatsApp message, screenshot link, bill');
v = await j(`/api/orders/${tok}`);
assert.ok(v.body.whatsapp.url.startsWith('https://wa.me/917395893773?text=')); ok('WhatsApp link uses the shop number 917395893773');
const msg = decodeURIComponent(v.body.whatsapp.url.split('?text=')[1]);
for (const s of ['CAKE ORDER CONFIRMATION', a.body.orderId, p1.body.billNo, 'Test Customer', '9876543210', 'Cake Flavour: Chocolate Truffle Cake', 'Cake Weight: 1kg', 'Quantity: 2', 'Blue theme, name: Riya', 'Pickup Branch: Thillainagar', 'Pickup Time: 4:00 PM', 'Total Amount: Rs. 1800', 'UTR / Transaction ID: UTR123456789012', 'Payment Status: Payment Verification Pending', '/bill.pdf']) assert.ok(msg.includes(s), 'message missing ' + s);
assert.ok(!/PAID|CONFIRMED/.test(msg)); ok('WhatsApp message has every order detail, bill link and the pending status (no PAID / CONFIRMED)');
const billLink = /Bill: (\S+)/.exec(msg)[1];
assert.equal((await j(billLink.replace(/^https?:\/\/[^/]+/, ''))).status, 200); assert.equal((await j(`/api/orders/${'x'.repeat(32)}/bill.pdf`)).status, 404); ok('bill link in the message works only with the private order token');
const shotUrl = /Payment Screenshot: (\S+)/.exec(msg)[1];
assert.ok(shotUrl.includes('/api/proof/')); const proof = await j(shotUrl.replace(/^https?:\/\/[^/]+/, ''));
assert.equal(proof.status, 200); assert.equal(proof.r.headers.get('content-type'), 'image/png'); ok('screenshot link in the message opens the uploaded image');
assert.equal((await j('/api/proof/' + 'a'.repeat(40) + '.png')).status, 404); assert.equal((await j('/api/proof/..%2F..%2Fserver%2Fconfig.js')).status, 404); ok('screenshot link cannot be guessed or used for path traversal');
assert.equal((await post(`/api/orders/${tok}/whatsapp-opened`, {})).body.first, true);
assert.equal((await post(`/api/orders/${tok}/whatsapp-opened`, {})).body.first, false);
assert.equal((await j(`/api/orders/${tok}`)).body.whatsapp.alreadyOpened, true); ok('auto-open allowed exactly once (refresh does not re-trigger)');
const pdf = await j(`/api/orders/${tok}/bill.pdf`);
assert.equal(pdf.status, 200); assert.equal(pdf.body.slice(0, 5).toString(), '%PDF-'); assert.match(pdf.r.headers.get('content-disposition'), /BB-BILL-/); fs.writeFileSync('/tmp/bill-test.pdf', pdf.body); ok('bill PDF downloads');
assert.equal((await j(`/api/orders/${tok}/bill.pdf`)).body.length, pdf.body.length); ok('bill number stable on re-download');

console.log('No admin');
assert.equal((await j('/api/admin/orders')).status, 404); ok('admin API does not exist');

console.log('Misc');
const ph = await post('/api/orders', order({ phone: '91234 56780' }), { 'idempotency-key': key() });
assert.equal((await post('/api/track', { orderId: (await j(`/api/orders/${ph.body.token}`)).body.orderId, phone: '+91 91234 56780' })).body.token, ph.body.token); assert.equal((await j(`/api/orders/${ph.body.token}`)).body.phone, '9123456780'); ok('mobile numbers starting with 91 are kept intact (+91 prefix still accepted)');
assert.equal((await post('/api/track', { orderId: a.body.orderId.toLowerCase(), phone: '+91 98765 43210' })).body.token, tok); ok('track order by Order ID + mobile');
assert.equal((await post('/api/track', { orderId: a.body.orderId, phone: '9999999999' })).status, 404); ok('track fails with wrong mobile');
const cfgRes = await j('/api/config'); assert.equal(cfgRes.body.upi.id, 'achyutsamhari@okhdfcbank'); assert.equal(cfgRes.body.pricing.perKg, 900); assert.ok(!JSON.stringify(cfgRes.body).includes('pass')); ok('public config shows the new UPI details + prices, no secrets');
const ids = new Set([a.body.orderId, b.body.orderId, tamper.body.orderId, hd.body.orderId]); assert.equal(ids.size, 4); ok('order IDs unique');

console.log(`\nAll ${passed} checks passed.`);
server.close(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0);
