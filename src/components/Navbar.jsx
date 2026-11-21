import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV, SITE } from '../data/site';

/** `home` = rendered on the homepage (section links become in-page anchors). `logoHidden` hides the header logo while the intro animation flies it into place. */
export default function Navbar({ home = false, logoHidden = false }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const path = window.location.pathname;
  const link = (h) => (home && h.startsWith('/#') ? h.slice(1) : h);
  useEffect(() => {
    if (!home) return;
    const els = NAV.filter(([, h]) => h.startsWith('/#')).map(([, h]) => document.querySelector(h.slice(1))).filter(Boolean);
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(`/#${e.target.id}`)), { rootMargin: '-45% 0px -50% 0px' });
    els.forEach((el) => io.observe(el)); return () => io.disconnect();
  }, [home]);
  const on = (h) => (h === path && !h.includes('#')) || active === h;
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-cream/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5" aria-label="Main">
        <a href="/" className="flex items-center gap-3" aria-label="The Bread Basket – home">
          <img id="nav-logo" src={SITE.images.logo} alt="The Bread Basket" width="64" height="44" style={{ opacity: logoHidden ? 0 : 1 }} className="h-11 w-auto" />
          <span className="hidden font-serif text-xl font-bold text-choc sm:inline">The Bread Basket</span>
        </a>
        <ul className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {NAV.map(([l, h]) => <li key={h}><a href={link(h)} aria-current={on(h) ? 'page' : undefined}
            className={`relative inline-block py-1 transition hover:-translate-y-0.5 hover:text-caramel after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-caramel after:transition-transform ${on(h) ? 'text-choc after:scale-x-100' : 'text-ink/80 after:scale-x-0'}`}>{l}</a></li>)}
        </ul>
        <div className="flex items-center gap-3">
          <a href="/order-online" className="btn-gold !px-4 !py-2 text-xs sm:!px-6 sm:!py-2.5 sm:text-sm">Order Now</a>
          <button className="rounded-lg p-2 text-choc lg:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-choc/10 bg-cream px-5 pb-6 pt-2 lg:hidden">
          {NAV.map(([l, h]) => <a key={h} href={link(h)} onClick={() => setOpen(false)} className={`block border-b border-choc/10 py-3.5 font-medium ${on(h) ? 'text-caramel' : 'text-choc'}`}>{l}</a>)}
          <a href="/track" className="block border-b border-choc/10 py-3.5 font-medium text-choc">Track Order</a>
        </div>
      )}
    </header>
  );
}
