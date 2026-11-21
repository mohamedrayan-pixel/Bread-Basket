import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Download, Home, Loader2, MessageCircle, Printer, Smartphone, UploadCloud, X, ZoomIn, Check } from 'lucide-react';
import { SITE } from '../data/site';
import { api } from '../api';
import { fmtDate, fmtTime } from '../utils/order';
import { fmtDateTime, inr } from '../utils/format';

const MAX_MB = 5;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const Shell = ({ children }) => (
  <div className="relative min-h-screen overflow-hidden bg-cream px-4 py-8 sm:py-12">
    <div className="relative mx-auto max-w-5xl">
      <a href="/" className="no-print mb-6 flex w-fit items-center gap-3" aria-label="The Bread Basket – home"><img src={SITE.images.logo} alt="The Bread Basket" className="h-14 w-auto" /></a>
      {children}
    </div>
  </div>
);

const Row = ({ k, children }) => children ? (<div className="flex justify-between gap-4 border-b border-choc/10 py-2 text-sm last:border-0"><dt className="text-ink/60">{k}</dt><dd className="text-right font-medium text-choc">{children}</dd></div>) : null;

function Summary({ o, title = 'Order summary' }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10">
      <h2 className="mb-2 font-serif text-xl text-choc">{title}</h2>
      <dl>
        <Row k="Order reference">{o.orderId}</Row>
        {o.billNo && <Row k="Bill number">{o.billNo}</Row>}
        <Row k="Customer">{o.name}</Row>
        <Row k="Mobile">{o.phone}</Row>
        <Row k="Cake flavour">{o.flavour}</Row>
        <Row k="Cake weight">{o.size}</Row>
        <Row k="Quantity">{o.quantity}</Row>
        <Row k="Design / customization">{o.design}</Row>
        <Row k="Additional instructions">{o.notes}</Row>
        <Row k="Pickup branch (store pickup only)">{o.pickupBranch}</Row>
        <Row k="Pickup date & time">{fmtDate(o.date)}, {fmtTime(o.time)}</Row>
        <Row k="Price per cake">{inr(o.unitPrice)}</Row>
      </dl>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-choc px-5 py-3 text-cream"><span className="text-sm">Total order amount</span><span className="font-serif text-3xl">{inr(o.total)}</span></div>
    </section>
  );
}

function QrZoom({ src, onClose }) {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  return (
    <motion.div role="dialog" aria-modal="true" aria-label="UPI QR code enlarged" className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <button aria-label="Close" className="absolute right-4 top-4 rounded-full bg-cream p-2 text-choc"><X /></button>
      <motion.img src={src} alt="UPI QR code – enlarged" className="max-h-[92vh] max-w-full rounded-2xl bg-white object-contain" initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }} onClick={(e) => e.stopPropagation()} />
    </motion.div>
  );
}

// ---------------- 1. checkout: QR + screenshot upload ----------------
function Checkout({ o, token, onSubmitted }) {
  const upi = SITE.upi;
  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [utr, setUtr] = useState('');
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [top, setTop] = useState('');
  const upiLink = `upi://pay?pa=${encodeURIComponent(upi.id)}&pn=${encodeURIComponent(upi.payeeName)}&am=${o.total}&cu=INR&tn=${encodeURIComponent(o.orderId)}`;

  useEffect(() => { if (!file) { setPreview(''); return; } const u = URL.createObjectURL(file); setPreview(u); return () => URL.revokeObjectURL(u); }, [file]);

  const pick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    if (!TYPES.includes(f.type)) { setErrs((x) => ({ ...x, screenshot: 'Please choose a JPG, PNG or WEBP image.' })); e.target.value = ''; return; }
    if (f.size > MAX_MB * 1024 * 1024) { setErrs((x) => ({ ...x, screenshot: `Image must be smaller than ${MAX_MB} MB.` })); e.target.value = ''; return; }
    setErrs((x) => ({ ...x, screenshot: undefined })); setFile(f);
  };
  const copy = async () => { try { await navigator.clipboard.writeText(upi.id); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copy the UPI ID:', upi.id); } };

  async function submit(e) {
    e.preventDefault(); if (busy) return;
    const ref = utr.replace(/\s/g, '').toUpperCase(); const found = {};
    if (!file) found.screenshot = 'Please upload your payment screenshot.';
    if (!/^[A-Z0-9]{8,30}$/.test(ref)) found.utr = 'Enter the transaction ID / UTR from your payment app (8–30 letters or digits).';
    setErrs(found); setTop('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try { onSubmitted(await api.submitPayment(token, ref, file)); }
    catch (ex) { if (ex.data?.fields) setErrs(ex.data.fields); setTop(ex.message); setBusy(false); }
  }

  return (
    <>
      <motion.h1 className="font-serif text-3xl font-bold text-choc sm:text-4xl" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>Payment</motion.h1>
      <p role="status" className="mt-2 rounded-2xl bg-white p-4 text-ink/80 ring-1 ring-choc/10">Hi {o.name.split(' ')[0]}, your cake order has been saved with reference <b className="text-choc">{o.orderId}</b>. Pay by UPI, then upload your payment screenshot and UTR to continue.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Summary o={o} />

        <motion.section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
          <h2 className="text-center font-serif text-3xl font-bold tracking-wide text-choc">SCAN &amp; PAY</h2>
          <p className="mt-1 text-center text-sm text-ink/70">Pay exactly <b className="text-choc">{inr(o.total)}</b></p>
          <button type="button" onClick={() => setZoom(true)} className="group relative mx-auto mt-4 block w-full max-w-[300px] rounded-2xl bg-[#F1F5FF] p-2 pulse-ring transition-transform active:scale-95" aria-label="Enlarge QR code">
            <img src={upi.qrImage} alt={`UPI QR code for ${upi.payeeName}, UPI ID ${upi.id}`} className="h-auto w-full rounded-xl object-contain" width="1152" height="1600" />
            <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-choc text-cream shadow transition group-hover:scale-110"><ZoomIn size={18} aria-hidden /></span>
          </button>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={copy} className="btn-outline !py-2.5">{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy UPI ID</>}</button>
            <a href={upiLink} className="btn-primary !py-2.5 sm:hidden"><Smartphone size={16} /> Pay with UPI app</a>
          </div>
          <p className="mt-2 text-center text-sm text-ink/80">UPI ID: <b>{upi.id}</b><br />UPI / mobile payment number: <b>{upi.mobile}</b></p>
          <p role="note" className="mt-4 rounded-xl bg-sand p-3 text-xs leading-relaxed text-choc"><b>Please verify before paying.</b> This is a static QR code, so it does not carry the amount. Check that your UPI app shows the recipient name <b>{upi.payeeName}</b> (UPI ID {upi.id}) and type the amount <b>{inr(o.total)}</b> yourself.</p>
          <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-ink/80">
            <li>Open Google Pay, PhonePe, Paytm or another UPI app.</li>
            <li>Scan the QR code{' '}<span className="text-ink/60">(on a phone, use “Pay with UPI app”).</span></li>
            <li>Verify the recipient details.</li>
            <li>Pay the exact amount: <b>{inr(o.total)}</b>.</li>
            <li>Take a screenshot of the successful transaction.</li>
            <li>Upload the screenshot below.</li>
          </ol>
        </motion.section>
      </div>

      <form onSubmit={submit} noValidate className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10">
        <h2 className="font-serif text-xl text-choc">Submit payment details</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium text-choc">Payment screenshot <span className="text-red-700" aria-hidden>*</span></p>
            <label className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition hover:border-caramel hover:bg-sand/50 ${errs.screenshot ? 'border-red-500' : 'border-choc/25'}`}>
              {preview ? <img src={preview} alt="Screenshot preview" className="max-h-56 rounded-lg object-contain" /> : <><UploadCloud className="text-caramel" aria-hidden /><span className="text-sm text-choc">Tap to choose a screenshot</span><span className="text-xs text-ink/60">JPG, PNG or WEBP · up to {MAX_MB} MB</span></>}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick} aria-describedby={errs.screenshot ? 'e-shot' : undefined} />
            </label>
            {file && <button type="button" onClick={() => setFile(null)} className="mt-2 text-xs font-medium text-caramel underline">Remove / choose another</button>}
            {errs.screenshot && <p id="e-shot" role="alert" className="mt-1 text-xs text-red-700">{errs.screenshot}</p>}
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="utr" className="mb-1 block text-sm font-medium text-choc">Transaction ID / UTR number <span className="text-red-700" aria-hidden>*</span></label>
              <input id="utr" className={`input ${errs.utr ? '!border-red-500' : ''}`} value={utr} onChange={(e) => { setUtr(e.target.value); setErrs((x) => ({ ...x, utr: undefined })); }} placeholder="e.g. 412345678901" autoComplete="off" inputMode="text" aria-invalid={!!errs.utr} />
              {errs.utr && <p role="alert" className="mt-1 text-xs text-red-700">{errs.utr}</p>}
            </div>
            <div>
              <label htmlFor="amt" className="mb-1 block text-sm font-medium text-choc">Payment amount</label>
              <input id="amt" className="input bg-sand/60 font-semibold" value={inr(o.total)} readOnly aria-readonly="true" />
              <p className="mt-1 text-xs text-ink/60">Set by our server from your order – it cannot be changed.</p>
            </div>
          </div>
        </div>
        {top && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{top}</p>}
        <button className="btn-gold mt-5 w-full !py-4 text-base" disabled={busy}>{busy ? <><Loader2 className="animate-spin" size={18} /> Submitting…</> : 'Submit Payment Details'}</button>
        <p className="mt-3 text-center text-xs text-ink/60">Submitting these details does not confirm your payment. The bakery verifies every payment manually. Please enter the exact UTR shown in your payment app.</p>
      </form>
      <AnimatePresence>{zoom && <QrZoom src={upi.qrImage} onClose={() => setZoom(false)} />}</AnimatePresence>
    </>
  );
}

// ---------------- 2. submitted: confirmation message, bill, WhatsApp ----------------
const CONFIRM_MESSAGE = 'Your cake order has been placed successfully! Your bill and payment details are ready. Please continue to WhatsApp and send your order confirmation to complete the process.';

function Bill({ o }) {
  const L = ({ k, children }) => children ? <div className="flex justify-between gap-4 border-b border-choc/10 py-1.5 text-sm"><dt className="text-ink/60">{k}</dt><dd className="text-right font-medium text-choc">{children}</dd></div> : null;
  return (
    <article className="print-area mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-choc/10" aria-label="Bill">
      <header className="flex items-center justify-between gap-4 border-b-4 border-caramel bg-cream px-6 py-4">
        <div className="flex items-center gap-4"><img src={SITE.images.logo} alt="The Bread Basket" width="96" height="66" className="h-16 w-auto" />
          <div><p className="font-serif text-2xl font-bold text-choc">The Bread Basket</p><p className="text-xs text-ink/60">a Bakery for the Connoisseur's Delight</p></div></div>
        <div className="text-right"><p className="font-serif text-xl font-bold text-caramel">Order Bill</p><p className="text-xs text-ink/70">Contact: {SITE.billPhone}</p></div>
      </header>
      <div className="grid gap-x-8 px-6 py-5 sm:grid-cols-2">
        <dl><L k="Order reference">{o.orderId}</L><L k="Bill number">{o.billNo}</L><L k="Order date & time">{fmtDateTime(o.createdAt)}</L><L k="Customer">{o.name}</L><L k="Mobile">{o.phone}</L></dl>
        <dl><L k="Cake flavour">{o.flavour}</L><L k="Cake weight">{o.size}</L><L k="Quantity">{o.quantity}</L><L k="Pickup branch">{o.pickupBranch}</L><L k="Pickup date">{fmtDate(o.date)}</L><L k="Preferred pickup time">{fmtTime(o.time)}</L></dl>
      </div>
      <div className="px-6 pb-4 text-sm"><p className="font-medium text-caramel">Cake design / customization</p><p className="mt-1 whitespace-pre-wrap text-choc">{o.design}</p>
        {o.notes && <><p className="mt-3 font-medium text-caramel">Additional instructions</p><p className="mt-1 whitespace-pre-wrap text-choc">{o.notes}</p></>}</div>
      <div className="mx-6 mb-4 flex items-center justify-between rounded-2xl bg-sand px-5 py-3"><span className="font-semibold text-choc">Total order amount</span><span className="font-serif text-3xl text-choc">{inr(o.total)}</span></div>
      <div className="mx-6 mb-6 rounded-2xl border-2 border-amber-600 bg-amber-50 p-4">
        <p className="font-bold text-amber-800">Payment status: Payment Verification Pending</p>
        <p className="mt-1 text-sm text-choc">UTR / Transaction ID: <b>{o.payment?.utr}</b></p>
        <p className="mt-1 text-xs text-ink/70">Your payment has not been verified yet. The bakery will verify it and contact you.</p>
      </div>
    </article>
  );
}

function Submitted({ o, token, refresh }) {
  const fired = useRef(false);
  const [blocked, setBlocked] = useState(false);
  const open = () => { const w = window.open(o.whatsapp.url, '_blank'); if (w) w.opener = null; else window.location.href = o.whatsapp.url; };

  // Opens the owner's WhatsApp with the message already written, exactly once (server-enforced).
  // The customer must still press SEND in WhatsApp: nothing is sent by this website.
  useEffect(() => {
    if (fired.current || !o.whatsapp || o.whatsapp.alreadyOpened) return;
    fired.current = true;
    api.whatsappOpened(token).then((r) => {
      if (r.first) { const w = window.open(o.whatsapp.url, '_blank'); if (w) w.opener = null; else setBlocked(true); }
      refresh();
    }).catch(() => {});
  }, [o.whatsapp, token, refresh]);

  return (
    <>
      <div className="no-print rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-choc/10 sm:p-8">
        <h1 className="font-serif text-2xl font-bold leading-snug text-choc sm:text-3xl">{CONFIRM_MESSAGE}</h1>
        <p className="mt-3 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-semibold text-amber-900">Payment Verification Pending</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={open} className="btn-primary !bg-[#1c7c4a] hover:!bg-[#16603a]"><MessageCircle size={17} /> Continue to WhatsApp</button>
          <a href={api.billUrl(token)} download className="btn-primary"><Download size={17} /> Download Bill (PDF)</a>
          <button type="button" onClick={() => window.print()} className="btn-outline"><Printer size={17} /> Print Bill</button>
          <a href="/" className="btn-outline"><Home size={17} /> Back to Home</a>
        </div>
        <p role="status" className="mx-auto mt-5 max-w-lg text-xs leading-relaxed text-ink/60">
          {blocked ? 'Your browser blocked the automatic WhatsApp window. Please tap “Continue to WhatsApp”. ' : 'WhatsApp opens with your order details already written. '}
          Nothing is sent until you press <b>Send</b> in WhatsApp.
        </p>
      </div>
      <div className="mt-6"><Bill o={o} /></div>
    </>
  );
}

export default function OrderPage({ token }) {
  const [o, setO] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.getOrder(token).then((x) => { setO(x); setErr(''); }).catch((e) => setErr(e.status === 404 ? 'We could not find this order. Please check the link.' : e.message)), [token]);
  useEffect(() => { load(); }, [load]);
  const submitted = o?.paymentStatus === 'PAYMENT_VERIFICATION_PENDING';

  return (
    <Shell>
      {!o && !err && <div className="grid place-items-center py-24 text-choc" role="status"><Loader2 className="animate-spin" size={32} aria-label="Loading order" /></div>}
      {err && !o && <div role="alert" className="rounded-3xl bg-white p-8 text-center ring-1 ring-choc/10"><p className="text-choc">{err}</p></div>}
      {o && (submitted ? <Submitted o={o} token={token} refresh={load} /> : <Checkout o={o} token={token} onSubmitted={setO} />)}
    </Shell>
  );
}
