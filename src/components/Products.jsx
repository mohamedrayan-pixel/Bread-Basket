import { ArrowRight } from 'lucide-react';
import { CAKE_PRICING } from '../data/site';
import { Img, Reveal } from './ui';

export const rateLabel = (name) => (CAKE_PRICING.perKgByFlavour[name] ? '₹350 per 500g' : `₹${CAKE_PRICING.perKg} per kg`);
export const orderCakeUrl = (name) => `/custom-cake?flavour=${encodeURIComponent(name)}`;

export function CakeCard({ cake, big = false }) {
  return (
    <article className={`lift group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-choc/10 ${big ? 'lg:col-span-2 lg:row-span-2' : ''}`}>
      <Img src={cake.image} alt={cake.name} className={`${big ? 'aspect-[4/3] lg:aspect-auto lg:flex-1' : 'aspect-[4/3]'} [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105`} />
      <div className="flex items-center justify-between gap-3 p-4">
        <div>
          <h3 className={`font-serif text-choc ${big ? 'text-2xl' : 'text-lg'}`}>{cake.name}</h3>
          <p className="mt-0.5 text-sm font-semibold text-brandDark">{rateLabel(cake.name)}</p>
        </div>
        <a href={orderCakeUrl(cake.name)} aria-label={`Order ${cake.name}`} className="btn-gold !p-3 shrink-0"><ArrowRight size={16} /></a>
      </div>
    </article>
  );
}

export function CakeGrid({ cakes, featured = false }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {cakes.map((c, i) => <Reveal key={c.name} className={featured && i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''}><CakeCard cake={c} big={featured && i === 0} /></Reveal>)}
    </div>
  );
}

/** Donuts / snacks: secondary products. No price is shown until the owner supplies one. */
export function SmallGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((i) => (
        <Reveal key={i.name}>
          <article className="lift group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-choc/10">
            <Img src={i.image} alt={i.name} className="aspect-[4/3] [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105" />
            <div className="p-4"><h3 className="font-medium text-choc">{i.name}</h3><p className="mt-1 text-sm font-semibold text-brandDark">Ask in store</p></div>
          </article>
        </Reveal>
      ))}
    </div>
  );
}
