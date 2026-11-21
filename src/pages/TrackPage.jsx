import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { SITE } from '../data/site';
import { api, rememberedOrders } from '../api';

export default function TrackPage() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const saved = rememberedOrders();
  async function go(e) {
    e.preventDefault(); setBusy(true); setErr('');
    try { const r = await api.track(orderId, phone); window.location.assign(`/order/${r.token}`); }
    catch (ex) { setErr(ex.message); setBusy(false); }
  }
  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-md">
        <a href="/"><img src={SITE.images.logo} alt="The Bread Basket" className="mx-auto h-16 w-auto" /></a>
        <h1 className="mt-6 text-center font-serif text-3xl font-bold text-choc">Track your order</h1>
        <form onSubmit={go} className="mt-6 space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-choc/10">
          <div><label htmlFor="t-id" className="mb-1 block text-sm font-medium text-choc">Order ID</label><input id="t-id" className="input" required placeholder="BB-2026-000001" value={orderId} onChange={(e) => setOrderId(e.target.value)} autoComplete="off" /></div>
          <div><label htmlFor="t-ph" className="mb-1 block text-sm font-medium text-choc">Mobile number used for the order</label><input id="t-ph" className="input" required type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Find my order</button>
        </form>
        {saved.length > 0 && (
          <div className="mt-6"><h2 className="mb-2 font-serif text-lg text-choc">Orders on this device</h2>
            <ul className="space-y-2">{saved.map((o) => <li key={o.token}><a className="block rounded-2xl bg-white p-3 text-sm font-medium text-choc ring-1 ring-choc/10 transition hover:ring-caramel" href={`/order/${o.token}`}>{o.orderId}</a></li>)}</ul></div>
        )}
        <p className="mt-6 text-center text-sm"><a href="/" className="text-caramel underline">Back to home</a></p>
      </div>
    </div>
  );
}
