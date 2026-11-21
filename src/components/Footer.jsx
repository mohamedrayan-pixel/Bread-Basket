import { useEffect, useState } from 'react';
import { MessageCircle, ArrowUp, Instagram, Facebook } from 'lucide-react';
import { SITE, NAV, MENU, BRANCHES, waUrl } from '../data/site';

export function Footer() {
  const h = 'mb-3 font-serif text-lg text-cream';
  const a = 'text-cream/70 transition hover:text-caramel';
  return (
    <footer className="bg-ink px-5 pb-8 pt-16 text-sm text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <img src={SITE.images.logo} alt="The Bread Basket" width="160" height="111" className="h-auto w-36" />
          <p className="mt-3 text-cream/70">A bakery for the connoisseur's delight. Freshly baked, affordable and loved in Trichy since 2001.</p>
          <div className="mt-4 flex gap-3">
            {[[Instagram, SITE.instagram, 'Instagram'], [Facebook, SITE.facebook, 'Facebook']].map(([I, u, n]) => (
              <a key={n} aria-label={n} href={u || '/#contact'} {...(u ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`${a} ${u ? '' : 'opacity-50'}`}><I size={20} /></a>))}
          </div>
        </div>
        <div><h3 className={h}>Quick Links</h3><ul className="space-y-2">{NAV.map(([l, u]) => <li key={u}><a className={a} href={u}>{l}</a></li>)}<li><a className={a} href="/order-online">Order Online</a></li><li><a className={a} href="/track">Track Your Order</a></li></ul></div>
        <div><h3 className={h}>Menu</h3><ul className="space-y-2"><li><a className={a} href="/cakes">Special Cakes</a></li>{MENU.map((c) => <li key={c.id}><a className={a} href="/menu">{c.name}</a></li>)}</ul></div>
        <div><h3 className={h}>Branches</h3><ul className="space-y-2">{BRANCHES.map((b) => <li key={b.name}><a className={a} href="/#branches">{b.name.replace(' – Flagship Outlet', '')}</a></li>)}</ul></div>
        <div><h3 className={h}>Contact</h3><ul className="space-y-2">
          <li><a className={a} href={`tel:${SITE.phone.replace(/\s/g, '')}`}>{SITE.phone}</a></li>
          <li><a className={a} href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
          <li className="text-cream/70">{BRANCHES[0].address}</li></ul></div>
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-cream/10 pt-6 text-center text-cream/60">© 2026 The Bread Basket. All Rights Reserved.</p>
    </footer>
  );
}

export function Floaters() {
  const [top, setTop] = useState(false);
  useEffect(() => {
    const f = () => setTop(window.scrollY > 600);
    window.addEventListener('scroll', f, { passive: true });
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <>
      <a href={waUrl('Hello The Bread Basket! I have an enquiry.')} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"><MessageCircle /></a>
      {top && <button aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-24 right-5 z-40 grid h-11 w-11 place-items-center rounded-full bg-choc text-cream shadow-lg hover:bg-caramel"><ArrowUp size={18} /></button>}
    </>
  );
}
