import { useRef, useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Loader2, MessageCircle, Smartphone, UploadCloud, Trash2 } from 'lucide-react';
import { SITE } from '../data/site';
import { fmtDate, fmtTime } from '../utils/order';
import { fmtDateTime, inr } from '../utils/format';
import { PAYMENT_METHOD, PAYMENT_STATUS, SHOT_MAX_MB, checkScreenshot, upiDeepLink, whatsAppLink } from '../utils/customCake';
import { downloadInvoice } from '../utils/invoicePdf';

const Row = ({ k, children }) => (children || children === 0) ? (
  <div className="flex justify-between gap-4 border-b border-choc/10 py-2 text-sm last:border-0"><dt className="shrink-0 text-ink/60">{k}</dt><dd className="break-words text-right font-medium text-choc [overflow-wrap:anywhere]">{children}</dd></div>
) : null;

export const Stepper = ({ step }) => (
  <ol className="mx-auto mb-8 flex max-w-md items-center justify-center gap-3 text-sm" aria-label="Progress">
    {['Order details', 'Payment & WhatsApp'].map((t, i) => (
      <li key={t} className="flex items-center gap-2" aria-current={step === i + 1 ? 'step' : undefined}>
        <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${step === i + 1 ? 'bg-brandDark text-white' : step > i + 1 ? 'bg-caramel text-white' : 'bg-white text-choc ring-1 ring-choc/20'}`}>{step > i + 1 ? <Check size={14} aria-hidden /> : i + 1}</span>
        <span className={step === i + 1 ? 'font-semibold text-choc' : 'text-ink/60'}>{t}</span>
        {i === 0 && <span className="mx-1 h-px w-6 bg-choc/25" aria-hidden />}
      </li>
    ))}
  </ol>
);

/**
 * Step 2 of the custom-cake flow. Purely frontend: the screenshot lives in the parent's memory (never uploaded anywhere),
 * the invoice is built in the browser, and WhatsApp is opened with a click-to-chat link.
 */
export default function CustomCakePayment({ order: o, shot, onShot, invoiceDone, onInvoice, onEdit, onNew }) {
  const upi = SITE.upi;
  const [copied, setCopied] = useState(false);
  const [shotErr, setShotErr] = useState('');
  const [paid, setPaid] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState('');
  const [waOpened, setWaOpened] = useState(false);
  const [waBlocked, setWaBlocked] = useState(false);
  const input = useRef(null);

  const pick = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const msg = checkScreenshot(f);
    e.target.value = ''; // lets the same file be picked again after removing it
    if (msg) { setShotErr(msg); return; }
    setShotErr(''); onShot(f);
  };
  const remove = () => { onShot(null); setShotErr(''); };
  const copy = async () => { try { await navigator.clipboard.writeText(upi.id); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copy the UPI ID:', upi.id); } };

  async function invoice() {
    if (pdfBusy) return;
    setPdfBusy(true); setPdfErr('');
    try { await downloadInvoice(o, { screenshot: !!shot }); onInvoice(); }
    catch { setPdfErr('We could not create the invoice PDF in this browser. Please try again, or send your order on WhatsApp without it.'); }
    finally { setPdfBusy(false); }
  }

  function whatsapp() {
    if (!paid) return;
    const url = whatsAppLink(o, { invoice: invoiceDone, screenshot: !!shot });
    const w = window.open(url, '_blank');
    if (w) { w.opener = null; setWaBlocked(false); } else { setWaBlocked(true); window.location.href = url; } // popup blocked -> same tab
    setWaOpened(true);
  }

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <button type="button" onClick={onEdit} className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-caramel underline-offset-2 hover:underline"><ArrowLeft size={16} aria-hidden /> Edit order details</button>

        <p role="status" className="rounded-2xl bg-white p-4 text-ink/80 ring-1 ring-choc/10">
          Hi {o.name.split(' ')[0]}, your order details are ready with reference <b className="break-all text-choc">{o.ref}</b>. <b>Your order is not confirmed yet.</b> Pay by UPI, then send the order to the bakery on WhatsApp. The bakery confirms it after verifying your payment.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* order summary */}
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10" aria-labelledby="sum-h">
            <h2 id="sum-h" className="mb-2 font-serif text-xl text-choc">Order summary</h2>
            <dl>
              <Row k="Order reference">{o.ref}</Row>
              <Row k="Order date">{fmtDateTime(o.createdAt)}</Row>
              <Row k="Customer">{o.name}</Row>
              <Row k="Mobile">{o.phone}</Row>
              <Row k="Occasion">{o.occasion}</Row>
              <Row k="Cake flavour">{o.flavour}</Row>
              <Row k="Cake weight">{o.size}</Row>
              <Row k="Quantity">{o.quantity}</Row>
              <Row k="Design / customization"><span className="whitespace-pre-wrap">{o.design}</span></Row>
              <Row k="Additional instructions"><span className="whitespace-pre-wrap">{o.notes}</span></Row>
              <Row k="Pickup branch (store pickup only)">{o.branch}</Row>
              <Row k="Pickup date & time">{fmtDate(o.date)}, {fmtTime(o.time)}</Row>
              <Row k="Price per cake">{inr(o.unit)}</Row>
              <Row k="Payment status">{PAYMENT_STATUS}</Row>
            </dl>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-choc px-5 py-3 text-cream"><span className="text-sm">Total order amount</span><span className="font-serif text-3xl">{inr(o.total)}</span></div>
          </section>

          {/* QR + instructions */}
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10" aria-labelledby="qr-h">
            <h2 id="qr-h" className="text-center font-serif text-3xl font-bold tracking-wide text-choc">SCAN &amp; PAY</h2>
            <p className="mt-1 text-center text-sm text-ink/70">Pay exactly <b className="text-choc">{inr(o.total)}</b> by {PAYMENT_METHOD}</p>
            <div className="mx-auto mt-4 block w-full max-w-[300px] rounded-2xl bg-[#F1F5FF] p-2">
              <img src={upi.qrImage} alt={`UPI QR code for ${upi.payeeName}, UPI ID ${upi.id}`} className="h-auto w-full rounded-xl object-contain" width="1152" height="1600" />
            </div>
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <button type="button" onClick={copy} className="btn-outline !py-2.5">{copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy UPI ID</>}</button>
              <a href={upiDeepLink(o)} className="btn-primary !py-2.5 sm:hidden"><Smartphone size={16} /> Pay with UPI app</a>
            </div>
            <p className="mt-2 text-center text-sm text-ink/80">UPI ID: <b className="break-all">{upi.id}</b><br />UPI / mobile payment number: <b>{upi.mobile}</b></p>
            <p role="note" className="mt-4 rounded-xl bg-sand p-3 text-xs leading-relaxed text-choc"><b>Please verify before paying.</b> This is a static QR code, so it may not carry the amount. Check that your UPI app shows the recipient name <b>{upi.payeeName}</b> (UPI ID {upi.id}) and enter the amount <b>{inr(o.total)}</b> yourself.</p>
            <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-ink/80">
              <li>Open Google Pay, PhonePe, Paytm or another UPI app.</li>
              <li>Scan the QR code above <span className="text-ink/60">(on a phone, use “Pay with UPI app”)</span>.</li>
              <li>Pay the exact order amount: <b>{inr(o.total)}</b>.</li>
              <li>Take a screenshot of the successful payment.</li>
              <li>Upload the payment screenshot below.</li>
              <li>Continue to send the order through WhatsApp.</li>
            </ol>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200"><b>Payment status: {PAYMENT_STATUS}.</b> Reaching this page does not mean your payment is done. The bakery verifies every payment manually before confirming your order.</p>
          </section>
        </div>

        {/* screenshot upload */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10" aria-labelledby="up-h">
          <h2 id="up-h" className="font-serif text-xl text-choc">Payment screenshot</h2>
          <p className="mt-1 text-sm text-ink/70">Keep your screenshot here so you can check it. It stays on your device — it is <b>not uploaded</b> to our website. You will attach it in WhatsApp in the last step.</p>
          <div className="mt-4">
            {shot ? (
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-choc/20 bg-sand/40 p-4 sm:flex-row sm:items-start">
                <img src={shot.url} alt="Payment screenshot preview" className="max-h-64 w-auto max-w-full rounded-lg object-contain ring-1 ring-choc/10" />
                <div className="min-w-0 text-sm text-choc">
                  <p className="break-all font-medium">{shot.file.name}</p>
                  <p className="text-xs text-ink/60">{(shot.file.size / 1024).toFixed(0)} KB · {shot.file.type.replace('image/', '').toUpperCase()}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => input.current?.click()} className="btn-outline !px-4 !py-2 text-xs"><UploadCloud size={14} aria-hidden /> Replace</button>
                    <button type="button" onClick={remove} className="btn-outline !px-4 !py-2 text-xs"><Trash2 size={14} aria-hidden /> Remove</button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => input.current?.click()} className={`flex min-h-[150px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 text-center transition hover:border-caramel hover:bg-sand/50 ${shotErr ? 'border-red-500' : 'border-choc/25'}`}>
                <UploadCloud className="text-caramel" aria-hidden /><span className="text-sm text-choc">Tap to choose your payment screenshot</span><span className="text-xs text-ink/60">JPG, JPEG, PNG or WEBP · up to {SHOT_MAX_MB} MB</span>
              </button>
            )}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={pick} aria-label="Choose payment screenshot" tabIndex={-1} />
            {shotErr && <p role="alert" className="mt-2 text-sm text-red-700">{shotErr}</p>}
          </div>
        </section>

        {/* invoice + whatsapp */}
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10" aria-labelledby="fin-h">
          <h2 id="fin-h" className="font-serif text-xl text-choc">Invoice &amp; send on WhatsApp</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={invoice} disabled={pdfBusy} className="btn-primary sm:flex-1">{pdfBusy ? <><Loader2 className="animate-spin" size={17} aria-hidden /> Creating invoice…</> : <><Download size={17} aria-hidden /> Download Invoice (PDF)</>}</button>
          </div>
          {pdfErr && <p role="alert" className="mt-2 text-sm text-red-700">{pdfErr}</p>}
          {invoiceDone && !pdfErr && <p role="status" className="mt-2 text-xs text-ink/60">Invoice downloaded. It shows “{PAYMENT_STATUS}” — it is not a payment receipt.</p>}

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-sand/60 p-4 text-sm text-choc">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D65E2A]" />
            <span>I have completed the UPI payment of <b>{inr(o.total)}</b> for this order.</span>
          </label>
          {paid && !shot && <p role="note" className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">You have not selected a payment screenshot. You can still continue, but please attach one in WhatsApp so the bakery can verify your payment.</p>}

          <button type="button" onClick={whatsapp} disabled={!paid} className="btn-primary mt-4 w-full !bg-[#1c7c4a] !py-4 text-base hover:!bg-[#16603a] disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle size={18} aria-hidden /> Send Order on WhatsApp</button>
          {!paid && <p className="mt-2 text-center text-xs text-ink/60">Tick the box above after you have paid to enable this button.</p>}

          <div role="note" className="mt-4 rounded-xl bg-[#E9F6EE] p-4 text-sm leading-relaxed text-choc ring-1 ring-[#1c7c4a]/25">
            <b>Important – attach your payment screenshot in WhatsApp.</b> WhatsApp opens with your order details already written. A website cannot attach files to a WhatsApp message, so please tap the attach (📎) button in WhatsApp, choose your payment screenshot, and then press <b>Send</b>.
          </div>
          {waOpened && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm text-choc ring-1 ring-choc/15">{waBlocked ? 'WhatsApp was opened in this tab. ' : 'WhatsApp should now be open. '}<b>Your order has not been sent yet</b> — it reaches the bakery only when you attach your screenshot and press <b>Send</b> in WhatsApp. Nothing is confirmed until the bakery verifies your payment. If WhatsApp did not open, tap the button again.</p>}
        </section>

        <p className="mt-6 text-center text-xs text-ink/60">Need to start over? <button type="button" onClick={onNew} className="font-medium text-caramel underline">Start a new order</button> (this clears the current reference).</p>
      </div>
    </>
  );
}
