import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MENU } from '../data/site';
import { Heading, Section } from './ui';

export default function Menu() {
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const groups = useMemo(() => MENU
    .filter((c) => cat === 'all' || c.id === cat)
    .map((c) => ({ ...c, items: c.items.filter((i) => i.name.toLowerCase().includes(q.trim().toLowerCase())) }))
    .filter((c) => c.items.length), [cat, q]);
  const tab = (active) => `rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-choc text-cream' : 'bg-sand text-choc hover:bg-caramel/30'}`;
  return (
    <Section id="menu">
      <Heading kicker="Explore Our Menu" title="Baked Fresh, Served with Care" sub="Prices are indicative and may vary by outlet and size." />
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Menu categories">
          <button role="tab" aria-selected={cat === 'all'} className={tab(cat === 'all')} onClick={() => setCat('all')}>All</button>
          {MENU.map((c) => <button key={c.id} role="tab" aria-selected={cat === c.id} className={tab(cat === c.id)} onClick={() => setCat(c.id)}>{c.name}</button>)}
        </div>
        <label className="relative block md:w-64">
          <span className="sr-only">Search menu</span>
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-choc/50" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search menu…" className="input !pl-10" />
        </label>
      </div>
      {groups.length === 0 && <p className="py-12 text-center text-ink/60">No items match “{q}”.</p>}
      {groups.map((c) => (
        <div key={c.id} className="mb-12">
          <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-choc/10 pb-3">
            <h3 className="font-serif text-2xl text-choc">{c.name}</h3>
            {c.note && <p className="text-sm text-caramel">{c.note}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {c.items.map((i) => (
              <article key={i.name} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-choc/5 lift group">
                <div className="p-4">
                  <h4 className="font-medium text-choc">{i.name}</h4>
                  
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </Section>
  );
}
