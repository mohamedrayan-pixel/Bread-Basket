// Dependency-free A4 PDF bill generator (standard Helvetica fonts + the bakery logo as an embedded JPEG).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE } from './config.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const LOGO = fs.readFileSync(path.join(here, 'assets/logo-bill.jpg'));
const LOGO_W = 420, LOGO_H = 289; // matches assets/logo-bill.jpg

// Helvetica glyph widths for ASCII 32..126 (1/1000 em)
const W = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];

const toLatin1 = (s) => String(s ?? '').replace(/₹/g, 'Rs. ').replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ')
  .replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '?');
const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const width = (s, size, bold) => [...s].reduce((a, ch) => a + (W[ch.charCodeAt(0) - 32] ?? 556), 0) * size / 1000 * (bold ? 1.06 : 1);

function wrap(text, size, maxW, bold) {
  const words = toLatin1(text).split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (width(t, size, bold) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

const rs = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;
const istDate = (iso) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
const fmtDate = (d) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); };
const fmtTime = (t) => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };

export function buildBillPdf(o, pay) {
  const ops = [];
  const color = (r, g, b, stroke) => ops.push(`${r} ${g} ${b} ${stroke ? 'RG' : 'rg'}`);
  const text = (s, x, y, { size = 10, bold = false, align = 'left', c = [0.19, 0.13, 0.11] } = {}) => {
    const t = toLatin1(s); const w = width(t, size, bold);
    const px = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    color(...c); ops.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${px.toFixed(2)} ${y.toFixed(2)} Td (${esc(t)}) Tj ET`);
  };
  const rect = (x, y, w, h, fill, stroke) => { if (fill) color(...fill); if (stroke) { color(...stroke, true); } ops.push(`${x} ${y} ${w} ${h} re ${fill && stroke ? 'B' : fill ? 'f' : 'S'}`); };
  const hline = (x1, x2, y, c = [0.85, 0.78, 0.68]) => { color(...c, true); ops.push(`0.6 w ${x1} ${y} m ${x2} ${y} l S`); };
  const BROWN = [0.357, 0.125, 0.094], CARAMEL = [0.839, 0.369, 0.165], AMBER = [0.66, 0.36, 0.04], GREY = [0.4, 0.35, 0.32];
  const L = 48, R = 547;

  // header: logo + name on a warm cream band with the brand-orange rule
  rect(0, 770, 595, 72, [1, 0.965, 0.92]);
  rect(0, 766, 595, 4, CARAMEL);
  ops.push(`q 92 0 0 ${(92 * LOGO_H / LOGO_W).toFixed(2)} ${L} 775 cm /Im1 Do Q`);
  text('THE BREAD BASKET', 170, 808, { size: 22, bold: true, c: BROWN });
  text('a Bakery for the Connoisseur\'s Delight', 170, 792, { size: 9.5, c: GREY });
  text('Order Bill', R, 808, { size: 14, bold: true, align: 'right', c: CARAMEL });
  text(`Contact: ${SITE.billPhone}`, R, 792, { size: 9.5, align: 'right', c: GREY });

  // ids box
  let y = 735;
  hline(L, R, y + 6, CARAMEL);
  text('BILL NUMBER', L, y - 12, { size: 8, c: GREY }); text(o.bill_no, L, y - 27, { size: 12, bold: true });
  text('ORDER ID', 230, y - 12, { size: 8, c: GREY }); text(o.order_id, 230, y - 27, { size: 12, bold: true });
  text('ORDER DATE & TIME', R, y - 12, { size: 8, align: 'right', c: GREY }); text(istDate(o.created_at), R, y - 27, { size: 10, bold: true, align: 'right' });
  hline(L, R, y - 38, CARAMEL);

  // customer + order info
  y = 665;
  text('BILLED TO', L, y, { size: 8, bold: true, c: CARAMEL });
  text(o.name, L, y - 15, { size: 11, bold: true });
  text(`Mobile: ${o.phone}`, L, y - 29, { size: 9.5 });
  text('PICKUP DETAILS (STORE PICKUP ONLY)', 310, y, { size: 8, bold: true, c: CARAMEL });
  text(`Branch: ${o.pickup_branch}`, 310, y - 15, { size: 9.5, bold: true });
  text(`Date: ${fmtDate(o.pref_date)}`, 310, y - 29, { size: 9.5 });
  text(`Preferred time: ${fmtTime(o.pref_time)}`, 310, y - 43, { size: 9.5 });

  // items table
  y = 590;
  rect(L, y - 6, R - L, 22, BROWN);
  text('CAKE DETAILS', L + 10, y, { size: 9, bold: true, c: [1, 1, 1] });
  text('QTY', 360, y, { size: 9, bold: true, align: 'right', c: [1, 1, 1] });
  text('UNIT PRICE', 450, y, { size: 9, bold: true, align: 'right', c: [1, 1, 1] });
  text('AMOUNT', R - 10, y, { size: 9, bold: true, align: 'right', c: [1, 1, 1] });
  y -= 24;
  text(`${o.flavour}`, L + 10, y, { size: 10.5, bold: true });
  text(`Weight: ${o.size}   |   Occasion: ${o.occasion}`, L + 10, y - 13, { size: 9, c: GREY });
  text(String(o.quantity), 360, y, { size: 10.5, align: 'right' });
  text(rs(o.unit_price), 450, y, { size: 10.5, align: 'right' });
  text(rs(o.subtotal), R - 10, y, { size: 10.5, align: 'right' });
  let dy = y - 30;
  text('DESIGN / CUSTOMIZATION', L + 10, dy, { size: 8, bold: true, c: CARAMEL });
  wrap(o.design || '-', 9.5, R - L - 24).slice(0, 4).forEach((ln, i) => { dy -= 12; text(ln, L + 10, dy, { size: 9.5 }); });
  if (o.notes) { dy -= 16; text('ADDITIONAL INSTRUCTIONS', L + 10, dy, { size: 8, bold: true, c: CARAMEL }); wrap(o.notes, 9.5, R - L - 24).slice(0, 3).forEach((ln) => { dy -= 12; text(ln, L + 10, dy, { size: 9.5 }); }); }
  dy -= 14; hline(L, R, dy);
  y = dy - 24;
  rect(300, y - 8, R - 300, 28, [1, 0.93, 0.86]);
  text('TOTAL ORDER AMOUNT', 312, y + 1, { size: 10, bold: true }); text(rs(o.total), R - 10, y, { size: 14, bold: true, align: 'right', c: BROWN });

  // status block: never claims the payment is verified
  y -= 62;
  rect(L, y - 50, R - L, 78, [1, 0.975, 0.9], AMBER);
  text('PAYMENT STATUS: PAYMENT VERIFICATION PENDING', L + 16, y + 6, { size: 11.5, bold: true, c: AMBER });
  text(`UTR / Transaction ID: ${pay?.utr || '-'}`, L + 16, y - 14, { size: 10.5, bold: true });
  text(`Details submitted: ${istDate(pay?.submitted_at || o.bill_generated_at)}`, L + 16, y - 28, { size: 9.5 });
  text('Your payment has not been verified yet. The bakery will check it and contact you.', L + 16, y - 42, { size: 8.5, c: GREY });

  // footer
  hline(L, R, 90, CARAMEL);
  text('Thank you for choosing The Bread Basket!', 297.5, 72, { size: 11, bold: true, align: 'center', c: BROWN });
  text('This is a computer-generated bill. Payment is subject to manual verification by The Bread Basket.', 297.5, 57, { size: 8, align: 'center', c: GREY });

  // ---- assemble PDF ----
  const content = Buffer.from(ops.join('\n'), 'latin1');
  const objs = [];
  const add = (b) => { objs.push(Buffer.isBuffer(b) ? b : Buffer.from(b, 'latin1')); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> /XObject << /Im1 7 0 R >> >> /Contents 6 0 R >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  add(Buffer.concat([Buffer.from(`<< /Length ${content.length} >>\nstream\n`), content, Buffer.from('\nendstream')]));
  add(Buffer.concat([Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${LOGO_W} /Height ${LOGO_H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${LOGO.length} >>\nstream\n`), LOGO, Buffer.from('\nendstream')]));
  const parts = [Buffer.from('%PDF-1.4\n')]; const offs = []; let len = parts[0].length;
  objs.forEach((b, i) => { offs.push(len); const chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`), b, Buffer.from('\nendobj\n')]); parts.push(chunk); len += chunk.length; });
  const xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${len}\n%%EOF`;
  parts.push(Buffer.from(xref));
  return Buffer.concat(parts);
}
