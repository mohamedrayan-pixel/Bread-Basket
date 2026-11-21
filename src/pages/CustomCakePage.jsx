import { useEffect, useMemo, useRef, useState } from 'react';
import { Store } from 'lucide-react';
import Page from '../components/Page';
import { Heading, Section } from '../components/ui';
import { ORDER_OPTIONS as OPT, CAKE_PRICING, PICKUP_HOURS } from '../data/site';
import { EMPTY_ORDER, validateOrder, totalPrice, todayISO, weightKg } from '../utils/order';
import { fmtTime } from '../utils/order';
import { inr } from '../utils/format';
import CustomCakePayment, { Stepper } from '../components/CustomCakePayment';
import { buildOrder, newOrderRef, saveSession, clearSession, loadSession } from '../utils/customCake';

const TIMES = (() => { const out = []; const [h0] = PICKUP_HOURS.from.split(':').map(Number); const [h1] = PICKUP_HOURS.to.split(':').map(Number); for (let h = h0; h <= h1; h++) for (const m of [0, 30]) { if (h === h1 && m) break; out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`); } return out; })();

const Group = ({ title, children }) => (
  <fieldset className="rounded-2xl bg-sand/60 p-4 md:p-6">
    <legend className="px-2 font-serif text-xl text-choc">{title}</legend>
    <div className="grid gap-4 md:grid-cols-2">{children}</div>
  </fieldset>
);
const Field = ({ k, label, req, span, err, hint, children }) => (
  <div className={span ? 'md:col-span-2' : ''}>
    <label htmlFor={`f-${k}`} className="mb-1 block text-sm font-medium text-choc">{label}{req && <span className="text-red-700" aria-hidden> *</span>}</label>
    {children}
    {hint && !err[k] && <p className="mt-1 text-xs text-ink/60">{hint}</p>}
    {err[k] && <p id={`f-${k}-e`} role="alert" className="mt-1 text-xs text-red-700">{err[k]}</p>}
  </div>
);

export default function CustomCakePage() {
  // Frontend-only flow: no API call. Step 1 = this form, step 2 = UPI payment / screenshot / invoice / WhatsApp.
  const preset = new URLSearchParams(window.location.search).get('flavour');
  const [saved] = useState(loadSession); // only restored after a refresh / back-forward, never on a fresh visit
  const [v, setV] = useState(saved?.values || { ...EMPTY_ORDER, flavour: OPT.flavours.includes(preset) ? preset : '' });
  const [order, setOrder] = useState(saved?.order || null); // set once the form is submitted -> payment step
  const [err, setErr] = useState({});
  const [top, setTop] = useState('');
  const [shot, setShot] = useState(null); // { file, url } – payment screenshot, kept in memory only
  const [invoiceDone, setInvoiceDone] = useState(false);
  const refRef = useRef(saved?.order?.ref || null); // the reference stays the same while the customer edits the same order
  const set = (k) => (e) => { setV({ ...v, [k]: e.target.value }); if (err[k]) setErr({ ...err, [k]: undefined }); setTop(''); };
  const price = useMemo(() => totalPrice(v), [v]);
  const ctl = (k, extra = '') => `input ${extra} ${err[k] ? '!border-red-500' : ''}`;
  const aria = (k) => ({ 'aria-invalid': !!err[k], 'aria-describedby': err[k] ? `f-${k}-e` : undefined });

  // object URL for the screenshot preview (revoked when replaced / removed)
  const pickShot = (file) => setShot((old) => { if (old) URL.revokeObjectURL(old.url); return file ? { file, url: URL.createObjectURL(file) } : null; });
  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url); }, [shot]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [order?.ref, !!order]);

  function submit(e) {
    e.preventDefault();
    const found = validateOrder(v); setErr(found);
    if (Object.keys(found).length) { setTop('Please correct the highlighted fields.'); document.getElementById(`f-${Object.keys(found)[0]}`)?.focus(); return; }
    if (!refRef.current) refRef.current = newOrderRef(); // generated once; re-submitting after an edit keeps it -> no duplicate orders
    const next = buildOrder({ ...v, quantity: Number(v.quantity) }, refRef.current, order?.createdAt);
    setTop(''); setOrder(next); setInvoiceDone(false);
    saveSession({ order: next, values: v });
  }
  function startNew() {
    if (!window.confirm('Start a new order? The current order reference and screenshot will be cleared.')) return;
    clearSession(); refRef.current = null; pickShot(null); setInvoiceDone(false); setOrder(null); setErr({}); setTop('');
    setV({ ...EMPTY_ORDER, flavour: '' });
  }

  if (order) return (
    <Page>
      <Section id="custom-cake" className="bg-sand">
        <Heading kicker="Custom Cake Orders" title="Complete Your Payment" sub="Pay by UPI, keep your payment screenshot, then send your order to the bakery on WhatsApp." />
        <Stepper step={2} />
        <CustomCakePayment order={order} shot={shot} onShot={pickShot} invoiceDone={invoiceDone} onInvoice={() => setInvoiceDone(true)} onEdit={() => setOrder(null)} onNew={startNew} />
      </Section>
    </Page>
  );

  return (
    <Page>
      <Section id="custom-cake" className="bg-sand">
        <Heading kicker="Custom Cake Orders" title="Design Your Cake" sub="Tell us what you would like. Custom cakes are for store pickup only. After you submit, you will pay by UPI and upload your payment screenshot." />
        <Stepper step={1} />
        <form onSubmit={submit} noValidate className="mx-auto max-w-3xl space-y-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-choc/10 md:p-8">
          <Group title="Your details">
            <Field k="name" label="Full Name" req err={err}><input id="f-name" className={ctl('name')} value={v.name} onChange={set('name')} autoComplete="name" maxLength={80} {...aria('name')} /></Field>
            <Field k="phone" label="Mobile Number" req err={err}><input id="f-phone" className={ctl('phone')} value={v.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" placeholder="10-digit mobile number" {...aria('phone')} /></Field>
          </Group>
          <Group title="Cake details">
            <Field k="occasion" label="Occasion" req err={err}><select id="f-occasion" className={ctl('occasion')} value={v.occasion} onChange={set('occasion')} {...aria('occasion')}>{OPT.occasions.map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field k="flavour" label="Cake Flavour" req err={err}><select id="f-flavour" className={ctl('flavour')} value={v.flavour} onChange={set('flavour')} {...aria('flavour')}><option value="">Select a flavour</option>{OPT.flavours.map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field k="size" label="Cake Weight" req err={err}><select id="f-size" className={ctl('size')} value={v.size} onChange={set('size')} {...aria('size')}><option value="">Select a weight</option>{OPT.sizes.map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field k="quantity" label="Quantity (number of cakes)" req err={err}><input id="f-quantity" className={ctl('quantity')} type="number" inputMode="numeric" min="1" max="50" value={v.quantity} onChange={set('quantity')} {...aria('quantity')} /></Field>
            {v.size === 'Custom Size' && <Field k="customKg" label="Required weight (kg)" req span err={err} hint={`Between ${CAKE_PRICING.minKg} and ${CAKE_PRICING.maxKg} kg, e.g. 2.5`}><input id="f-customKg" className={ctl('customKg')} type="number" inputMode="decimal" step="0.1" min={CAKE_PRICING.minKg} max={CAKE_PRICING.maxKg} value={v.customKg} onChange={set('customKg')} {...aria('customKg')} /></Field>}
            <Field k="design" label="Cake Design / Requirements" req span err={err} hint="Design, decoration, name to be written on the cake, special customization."><textarea id="f-design" rows={4} className={ctl('design')} value={v.design} onChange={set('design')} maxLength={1000} {...aria('design')} /></Field>
            <Field k="notes" label="Additional Instructions (optional)" span err={err}><textarea id="f-notes" rows={2} className={ctl('notes')} value={v.notes} onChange={set('notes')} maxLength={1000} /></Field>
          </Group>
          <Group title="Store pickup">
            <p className="flex items-center gap-2 rounded-xl bg-white p-3 text-sm text-choc md:col-span-2"><Store size={18} className="shrink-0 text-caramel" aria-hidden /> Custom cake orders are for <b>store pickup only</b>. We do not offer home delivery for custom cakes.</p>
            <Field k="branch" label="Pickup Branch" req span err={err}><select id="f-branch" className={ctl('branch')} value={v.branch} onChange={set('branch')} {...aria('branch')}><option value="">Select a branch</option>{OPT.branches.map((o) => <option key={o}>{o}</option>)}</select></Field>
            <Field k="date" label="Pickup Date" req err={err}><input id="f-date" className={ctl('date')} type="date" min={todayISO()} value={v.date} onChange={set('date')} {...aria('date')} /></Field>
            <Field k="time" label="Preferred Pickup Time" req err={err} hint="Between 10:00 AM and 10:00 PM"><select id="f-time" className={ctl('time')} value={v.time} onChange={set('time')} {...aria('time')}><option value="">Select a time</option>{TIMES.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}</select></Field>
          </Group>

          <div className="rounded-2xl bg-choc p-5 text-cream" aria-live="polite">
            <div className="flex items-center justify-between"><span className="text-sm">Total amount</span><span className="font-serif text-3xl">{price ? inr(price.total) : '—'}</span></div>
            <p className="mt-1 text-xs text-cream/75">{price ? `${inr(price.unit)} per cake (${weightKg(v.size, v.customKg)} kg) × ${v.quantity}` : 'Choose a flavour, weight and quantity to see the price.'}</p>
          </div>
          {top && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{top}</p>}
          <button className="btn-gold w-full !py-4 text-base">{refRef.current ? 'Update Order & Continue to Payment' : 'Submit Cake Order'}</button>
          <p className="text-center text-xs text-ink/60">Next step: pay by UPI and upload your payment screenshot.</p>
        </form>
      </Section>
    </Page>
  );
}
