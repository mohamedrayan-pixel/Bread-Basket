import { useState } from 'react';
import { Phone, Mail, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { SITE, BRANCHES, mapEmbedUrl, waUrl } from '../data/site';
import { Heading, Section } from './ui';

const TYPES = ['General enquiry', 'Custom cake order', 'Bulk / event order', 'Feedback'];

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a valid 10-digit mobile number.';
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = 'Enter a valid email address.';
  if (v.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
  return e;
}

export default function Contact() {
  const [v, setV] = useState({ name: '', phone: '', email: '', type: TYPES[0], message: '' });
  const [err, setErr] = useState({});
  const [status, setStatus] = useState(null); // null | sending | sent | error | nobackend
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    const found = validate(v); setErr(found);
    if (Object.keys(found).length) return;
    if (!SITE.formEndpoint) return setStatus('nobackend');
    setStatus('sending');
    try {
      const r = await fetch(SITE.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(v) });
      if (!r.ok) throw new Error();
      setStatus('sent'); setV({ name: '', phone: '', email: '', type: TYPES[0], message: '' });
    } catch { setStatus('error'); }
  }
  const field = (k, label, type = 'text') => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-medium text-choc">{label}</label>
      <input id={k} type={type} value={v[k]} onChange={set(k)} className="input" aria-invalid={!!err[k]} aria-describedby={err[k] ? `${k}-e` : undefined} />
      {err[k] && <p id={`${k}-e`} className="mt-1 text-xs text-red-700">{err[k]}</p>}
    </div>
  );
  const flagship = BRANCHES[0].address;
  const social = [['Instagram', Instagram, SITE.instagram], ['Facebook', Facebook, SITE.facebook]];
  return (
    <Section id="contact" className="bg-sand">
      <Heading kicker="Contact" title="We'd Love to Hear From You." />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="flex items-center gap-4 rounded-2xl bg-cream p-5 hover:ring-2 hover:ring-caramel"><Phone className="text-caramel" /><span><b className="block text-choc">Phone</b>{SITE.phone}</span></a>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-4 rounded-2xl bg-cream p-5 hover:ring-2 hover:ring-caramel"><Mail className="text-caramel" /><span><b className="block text-choc">Email</b>{SITE.email}</span></a>
          <a href={waUrl('Hello The Bread Basket! I have an enquiry.')} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-cream p-5 hover:ring-2 hover:ring-caramel"><MessageCircle className="text-caramel" /><span><b className="block text-choc">WhatsApp enquiry</b>Chat with us</span></a>
          <div className="flex gap-3 pt-2">
            {social.map(([n, I, url]) => (
              <a key={n} aria-label={n} title={url ? n : `${n} link not configured yet`} href={url || '#contact'} {...(url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`grid h-11 w-11 place-items-center rounded-full bg-choc text-cream transition hover:bg-caramel ${url ? '' : 'opacity-50'}`}><I size={18} /></a>
            ))}
          </div>
          <iframe title="The Bread Basket, Thillai Nagar map" src={mapEmbedUrl(`The Bread Basket, ${flagship}`)} loading="lazy"
            className="h-64 w-full rounded-2xl border-0" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl bg-cream p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">{field('name', 'Name')}{field('phone', 'Phone number', 'tel')}</div>
          {field('email', 'Email', 'email')}
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-choc">Enquiry type</label>
            <select id="type" value={v.type} onChange={set('type')} className="input">{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </div>
          <div>
            <label htmlFor="message" className="mb-1 block text-sm font-medium text-choc">Message</label>
            <textarea id="message" rows={4} value={v.message} onChange={set('message')} className="input" aria-invalid={!!err.message} />
            {err.message && <p className="mt-1 text-xs text-red-700">{err.message}</p>}
          </div>
          <button className="btn-primary w-full" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send Message'}</button>
          <div aria-live="polite" className="text-sm">
            {status === 'sent' && <p className="text-green-800">Thank you! Your message has been sent.</p>}
            {status === 'error' && <p className="text-red-700">Could not send your message. Please call or email us instead.</p>}
            {status === 'nobackend' && <p className="rounded-lg bg-amber-100 p-3 text-amber-900">Your details look valid, but form backend integration is required before messages can be delivered (set <code>formEndpoint</code> in <code>src/data/site.js</code>). Nothing was sent – please call or email us for now.</p>}
          </div>
        </form>
      </div>
    </Section>
  );
}
