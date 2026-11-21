// Thin client for the Bread Basket backend (server/). All money amounts and statuses come from the server.
async function call(path, { method = 'GET', json, body, headers = {} } = {}) {
  const h = { ...headers };
  if (json !== undefined) h['Content-Type'] = 'application/json';
  let res;
  try { res = await fetch(path, { method, headers: h, body: json !== undefined ? JSON.stringify(json) : body, credentials: 'same-origin' }); }
  catch { throw Object.assign(new Error('Cannot reach the server. Please check your connection and try again.'), { network: true }); }
  const isJson = (res.headers.get('content-type') || '').includes('json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) throw Object.assign(new Error(data?.error || 'Something went wrong. Please try again.'), { status: res.status, data });
  return data ?? res;
}

export const api = {
  config: () => call('/api/config'),
  createOrder: (order, key) => call('/api/orders', { method: 'POST', json: order, headers: { 'Idempotency-Key': key } }),
  getOrder: (token) => call(`/api/orders/${token}`),
  submitPayment: (token, utr, file) => { const f = new FormData(); f.set('utr', utr); f.set('screenshot', file); return call(`/api/orders/${token}/payment`, { method: 'POST', body: f }); },
  whatsappOpened: (token) => call(`/api/orders/${token}/whatsapp-opened`, { method: 'POST', json: {} }),
  track: (orderId, phone) => call('/api/track', { method: 'POST', json: { orderId, phone } }),
  billUrl: (token) => `/api/orders/${token}/bill.pdf`,
};

const KEY = 'bb_orders';
export const rememberOrder = (orderId, token) => {
  try { const l = JSON.parse(localStorage.getItem(KEY) || '[]').filter((o) => o.orderId !== orderId); l.unshift({ orderId, token, at: Date.now() }); localStorage.setItem(KEY, JSON.stringify(l.slice(0, 10))); } catch { /* storage unavailable */ }
};
export const rememberedOrders = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
