// Browser-only invoice PDF (jsPDF, loaded on demand so it never bloats the main bundle). No network request is made
// except reading the bakery logo that is already part of the site (/images/logo.png).
import { SITE } from '../data/site.js';
import { fmtDate, fmtTime } from './order.js';
import { PAYMENT_METHOD, PAYMENT_STATUS, invoiceFileName } from './customCake.js';

const BROWN = [91, 32, 24], CARAMEL = [214, 94, 42], CREAM = [255, 246, 235], SAND = [247, 238, 225], GREY = [110, 98, 92], AMBER = [168, 92, 10], LINE = [225, 210, 190];

// Standard PDF fonts cannot draw ₹, emoji or non-Latin scripts: use "Rs." and replace anything else with "?".
const clean = (s) => String(s ?? '').replace(/₹/g, 'Rs. ').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/\r\n?/g, '\n').replace(/[^\n\x20-\x7e -ÿ]/g, '?');
const rs = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;
const istStamp = (iso) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

// Draw the logo into a canvas so any PNG/JPG becomes a JPEG data-URL jsPDF can embed (flat white background).
async function loadLogo(src) {
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext('2d'); g.fillStyle = '#FFF6EB'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0);
    return { data: c.toDataURL('image/jpeg', 0.9), ratio: c.width / c.height };
  } catch { return null; } // the invoice still works without the logo
}

/** order = buildOrder() snapshot; opts = { screenshot: boolean }. Triggers the browser download. */
export async function downloadInvoice(order, { screenshot = false } = {}) {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), loadLogo(SITE.images.logo)]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, M = 16, R = W - M, CW = W - 2 * M, BOTTOM = 280;
  let y = 0;

  const fill = (c) => doc.setFillColor(...c), ink = (c) => doc.setTextColor(...c), stroke = (c) => doc.setDrawColor(...c);
  const font = (size, bold = false) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); };
  const lines = (txt, w, size, bold) => { font(size, bold); return doc.splitTextToSize(clean(txt) || '-', w); };
  const need = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = 18; } };
  const hr = (yy = y, c = LINE) => { stroke(c); doc.setLineWidth(0.25); doc.line(M, yy, R, yy); };

  // ---- header band ----
  fill(CREAM); doc.rect(0, 0, W, 38, 'F'); fill(CARAMEL); doc.rect(0, 38, W, 1.6, 'F');
  let tx = M;
  if (logo) { const h = 22, w = Math.min(h * logo.ratio, 40); doc.addImage(logo.data, 'JPEG', M, 8, w, w / logo.ratio); tx = M + w + 5; }
  ink(BROWN); font(19, true); doc.text('THE BREAD BASKET', tx, 19);
  ink(GREY); font(9.5); doc.text('Bakery, Confectionery & Café', tx, 25.5);
  ink(CARAMEL); font(17, true); doc.text('INVOICE', R, 18, { align: 'right' });
  ink(GREY); font(8.5);
  doc.text(clean(`Phone: ${SITE.billPhone}`), R, 24, { align: 'right' });
  if (SITE.email) doc.text(clean(SITE.email), R, 28.5, { align: 'right' });
  doc.text('Trichy, Tamil Nadu', R, 33, { align: 'right' });
  y = 48;

  // ---- reference / date ----
  ink(GREY); font(8); doc.text('ORDER REFERENCE', M, y); doc.text('ORDER DATE', R, y, { align: 'right' });
  ink(BROWN); font(13, true); doc.text(clean(order.ref), M, y + 6);
  font(10.5, true); doc.text(clean(istStamp(order.createdAt)), R, y + 6, { align: 'right' });
  y += 11; hr(y, CARAMEL); y += 8;

  // ---- customer | pickup (two columns) ----
  const colW = CW / 2 - 4, x2 = M + CW / 2 + 4;
  const block = (title, rows, x) => {
    ink(CARAMEL); font(9.5, true); doc.text(title, x, y);
    let yy = y + 6;
    for (const [k, v] of rows) {
      ink(GREY); font(8); doc.text(k, x, yy);
      const ls = lines(v, colW, 10, true); ink(BROWN); doc.text(ls, x, yy + 4.5);
      yy += 4.5 + ls.length * 4.6 + 2.5;
    }
    return yy;
  };
  const yA = block('CUSTOMER', [['Name', order.name], ['Mobile', order.phone]], M);
  const yB = block('STORE PICKUP', [['Branch', order.branch], ['Date & time', `${fmtDate(order.date)}, ${fmtTime(order.time)}`]], x2);
  y = Math.max(yA, yB) + 1; hr(); y += 8;

  // ---- order details ----
  ink(CARAMEL); font(9.5, true); doc.text('CUSTOM CAKE DETAILS', M, y); y += 6;
  const detail = (k, v) => {
    const ls = lines(v, CW - 48, 10, true);
    need(ls.length * 4.8 + 3);
    ink(GREY); font(9); doc.text(k, M, y);
    ink(BROWN); font(10, true); doc.text(ls, M + 48, y);
    y += ls.length * 4.8 + 2.2;
  };
  detail('Cake type', `Custom Cake (${order.occasion})`);
  detail('Flavour', order.flavour);
  detail('Cake size / weight', order.size);
  detail('Quantity', `${order.quantity} cake${order.quantity > 1 ? 's' : ''}`);
  detail('Design / customization', order.design);
  detail('Additional instructions', order.notes || 'None');
  y += 3;

  // ---- item-wise pricing ----
  need(46);
  fill(BROWN); doc.rect(M, y, CW, 8, 'F'); ink([255, 255, 255]); font(9, true);
  const cDesc = M + 3, cQty = M + CW - 62, cUnit = M + CW - 33, cAmt = R - 3;
  doc.text('Item', cDesc, y + 5.4); doc.text('Qty', cQty, y + 5.4, { align: 'right' }); doc.text('Price / cake', cUnit, y + 5.4, { align: 'right' }); doc.text('Amount', cAmt, y + 5.4, { align: 'right' });
  y += 8;
  const item = lines(`${order.flavour} - custom cake, ${order.size}`, cQty - cDesc - 14, 10, false);
  const rowH = item.length * 4.8 + 5;
  fill(SAND); doc.rect(M, y, CW, rowH, 'F');
  ink(BROWN); font(10); doc.text(item, cDesc, y + 5);
  doc.text(String(order.quantity), cQty, y + 5, { align: 'right' }); doc.text(rs(order.unit), cUnit, y + 5, { align: 'right' }); doc.text(rs(order.total), cAmt, y + 5, { align: 'right' });
  y += rowH + 3;
  fill(BROWN); doc.roundedRect(M + CW / 2, y, CW / 2, 13, 2, 2, 'F');
  ink([255, 255, 255]); font(10, true); doc.text('TOTAL AMOUNT', M + CW / 2 + 4, y + 8.3);
  font(15, true); doc.text(rs(order.total), cAmt, y + 8.8, { align: 'right' });
  y += 21;

  // ---- payment information ----
  need(44);
  fill([255, 248, 230]); stroke(AMBER); doc.setLineWidth(0.5); doc.roundedRect(M, y, CW, 36, 2, 2, 'FD');
  ink(AMBER); font(9.5, true); doc.text('PAYMENT INFORMATION', M + 5, y + 7);
  const pay = (k, v, yy, bold = true) => { ink(GREY); font(9); doc.text(k, M + 5, yy); ink(BROWN); font(10, bold); doc.text(clean(v), M + 52, yy); };
  pay('Payment method', PAYMENT_METHOD, y + 14);
  pay('Payment status', PAYMENT_STATUS, y + 20);
  pay('Payment screenshot submitted', screenshot ? 'Yes' : 'No', y + 26);
  ink(GREY); font(8); doc.text(lines('This invoice is NOT a payment receipt. The bakery verifies every payment manually and confirms the order after verification.', CW - 10, 8, false), M + 5, y + 32);
  y += 44;

  // ---- footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p); stroke(LINE); doc.setLineWidth(0.25); doc.line(M, 285, R, 285);
    ink(GREY); font(8);
    doc.text(clean(`The Bread Basket  |  ${SITE.billPhone}  |  Thank you for ordering with us!`), M, 290);
    doc.text(`Page ${p} of ${pages}`, R, 290, { align: 'right' });
  }

  doc.save(invoiceFileName(order.ref));
}
