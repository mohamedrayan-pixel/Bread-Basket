import { CAKE_PRICING, SIZE_KG, PICKUP_HOURS } from '../data/site.js';

// Pure helpers (no React) so they can be unit-tested.
export const EMPTY_ORDER = {
  name: '', phone: '', occasion: 'Birthday', flavour: '', size: '', customKg: '', design: '',
  quantity: 1, notes: '', type: 'Store Pickup', date: '', time: '', branch: '',
};

export function todayISO(now = new Date()) {
  const d = new Date(now); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/** Weight in kg for a chosen size (or the custom weight). Returns NaN when it is not a valid weight. */
export function weightKg(size, customKg) {
  if (size === 'Custom Size') {
    const txt = String(customKg ?? '').trim();
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(txt)) return NaN;
    return Number(txt);
  }
  return SIZE_KG[size] ?? NaN;
}
/** The size text stored with the order, e.g. "1kg" or "2.3kg" for a custom weight. */
export const sizeLabel = (size, customKg) => (size === 'Custom Size' ? `${weightKg(size, customKg)}kg` : size);

/** Price of ONE cake (whole rupees). Black/White Forest: Rs 350 per 500g, every other cake: Rs 900 per kg. */
export function unitPrice(flavour, kg) {
  if (!Number.isFinite(kg) || kg <= 0) return null;
  const rate = CAKE_PRICING.perKgByFlavour[flavour] ?? CAKE_PRICING.perKg;
  return Math.round(rate * kg);
}
export function totalPrice(v) {
  const q = Number(v.quantity); const unit = unitPrice(v.flavour, weightKg(v.size, v.customKg));
  if (unit === null || !Number.isInteger(q) || q < 1) return null;
  return { unit, total: unit * q };
}

export function validateOrder(v, now = new Date()) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your full name.';
  if (!/^(\+?91)?[6-9]\d{9}$/.test(v.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (!v.branch) e.branch = 'Please choose a pickup branch.';
  if (!v.occasion) e.occasion = 'Please select an occasion.';
  if (!v.flavour) e.flavour = 'Please select a cake flavour.';
  if (!v.size) e.size = 'Please select a cake weight.';
  else if (v.size === 'Custom Size') {
    const kg = weightKg(v.size, v.customKg);
    if (!Number.isFinite(kg)) e.customKg = 'Enter the weight in kg, e.g. 2.5';
    else if (kg < CAKE_PRICING.minKg || kg > CAKE_PRICING.maxKg) e.customKg = `Weight must be between ${CAKE_PRICING.minKg} and ${CAKE_PRICING.maxKg} kg.`;
  }
  const q = Number(v.quantity);
  if (!Number.isInteger(q) || q < 1 || q > 50) e.quantity = 'Quantity must be at least 1.';
  if (v.design.trim().length < 3) e.design = 'Please describe the cake design / requirements.';
  if (!v.date) e.date = 'Please choose a pickup date.';
  else if (v.date < todayISO(now)) e.date = 'Past dates cannot be selected.';
  if (!v.time) e.time = 'Please choose a preferred pickup time.';
  else {
    if (v.time < PICKUP_HOURS.from || v.time > PICKUP_HOURS.to) e.time = 'Pickup time must be between 10:00 AM and 10:00 PM.';
    else if (v.date === todayISO(now)) {
      const [h, m] = v.time.split(':').map(Number);
      if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) e.time = 'Please choose a time later than now.';
    }
  }
  return e;
}

export const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};
export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
