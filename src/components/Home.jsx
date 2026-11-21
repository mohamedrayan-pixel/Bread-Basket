import { Clock, Utensils, Store, Wallet, CalendarCheck, Cake } from 'lucide-react';
import { motion } from 'framer-motion';
import { SITE, SPECIAL_CAKES, DONUTS, SNACKS } from '../data/site';
import { Img, Reveal, Heading, Section } from './ui';
import { Tilt } from './fx';
import { Snow, Garland, Ornament, Holly } from './Christmas';
import { CakeGrid, SmallGrid } from './Products';

export function Hero() {
  const xmas = SITE.christmas;
  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-caramel via-[#C85526] to-[#A9421A] px-5 pb-20 pt-36 text-white md:pt-44">
      {xmas && <><Snow /><Garland /></>}
      {xmas && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[6.2rem] hidden justify-between px-[8%] sm:flex"><Ornament color="#B3202A" /><Ornament color="#C9A227" size={36} className="mt-2" /><span className="hidden lg:block" /><Ornament color="#1F5E3B" size={40} /><Ornament color="#B3202A" size={34} className="mt-3" /></div>}
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
          {xmas && <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-xred px-4 py-1.5 text-sm font-semibold text-white ring-2 ring-gold/70"><span aria-hidden>🎄</span> Merry Christmas from The Bread Basket</span>}
          <h1 className="font-serif text-4xl font-bold leading-tight md:text-6xl">{xmas ? 'Christmas Cakes, Baked Fresh in Trichy.' : 'Freshly Baked Happiness, Since 2001.'}</h1>
          <p className="mt-6 max-w-xl text-lg text-white/90">{xmas ? 'Make the season sweeter with our special cakes. Choose your flavour, weight and design, then pick it up fresh from your nearest Bread Basket.' : 'Special cakes, freshly baked breads and café favourites that Trichy has loved for generations.'}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="/order-online" className="btn-light !px-8 !py-4 text-base">Order Now</a>
            <a href="/cakes" className="btn border border-white/60 text-white hover:bg-white/15">View Special Cakes</a>
          </div>
          <p className="mt-6 text-sm text-white/80">Serving Trichy since 2001 · Custom cakes are for store pickup</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="mx-auto w-full max-w-[300px] sm:max-w-md lg:max-w-none">
          <Tilt><div className={`grid place-items-center rounded-[2rem] bg-cream p-6 shadow-2xl shadow-choc/30 sm:p-10 lg:p-12 ${xmas ? 'ring-4 ring-gold/70' : 'ring-1 ring-white/50'}`}>
            <img src={SITE.images.logo} width="640" height="443" alt="The Bread Basket – a Bakery for the Connoisseur's Delight" className="h-auto w-full max-w-[520px] object-contain" />
          </div></Tilt>
        </motion.div>
      </div>
    </section>
  );
}

export function SpecialCakes() {
  return (
    <Section id="special-cakes" className="bg-sand">
      {SITE.christmas && <Holly />}
      <Heading kicker="Special Cakes" title="Cakes Made for Every Celebration" sub="Birthday favourites and festive flavours, baked fresh. Pick your weight and collect it from your nearest branch." />
      <CakeGrid cakes={SPECIAL_CAKES.slice(0, 6)} featured />
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <a href="/cakes" className="btn-primary !px-8">See All 15 Special Cakes</a>
        <a href="/custom-cake" className="btn-gold !px-8"><Cake size={16} /> Order a Custom Cake</a>
      </div>
    </Section>
  );
}

export function Treats() {
  return (
    <Section id="treats">
      <Heading kicker="Also Fresh Today" title="Donuts & Savoury Snacks" sub="Pair your cake with something warm or sweet." />
      <h3 className="mb-4 font-serif text-2xl text-choc">Donuts</h3>
      <SmallGrid items={DONUTS} />
      <h3 className="mb-4 mt-12 font-serif text-2xl text-choc">Chicken &amp; Egg Snacks</h3>
      <SmallGrid items={SNACKS} />
      <p className="mt-10 text-center"><a href="/menu" className="btn-outline">Explore the Full Menu</a></p>
    </Section>
  );
}

export function About() {
  const points = [['Established in 2001', Clock], ['Multiple outlets across Trichy', Store], ['Fresh bakery products', Utensils], ['Affordable prices', Wallet], ['Cakes for every celebration', Cake]];
  return (
    <Section id="about" className="bg-sand">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal><Img src={SITE.images.about} alt="Baking at The Bread Basket" className="aspect-square rounded-[2.5rem]" /></Reveal>
        <Reveal>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-caramel">About Us</p>
          <h2 className="font-serif text-3xl font-semibold text-choc md:text-4xl">A Tradition of Taste Since 2001</h2>
          <p className="mt-5 leading-relaxed text-ink/75">The Bread Basket has been bringing people together through delicious baked goods, delightful confectionery, and satisfying café favourites since 2001. What started as a passion for great bakery products has grown into a familiar destination for customers across Tiruchirappalli. Whether it is your everyday bread, an evening snack, or a special celebration cake, we make every occasion a little sweeter.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {points.map(([t, I]) => <li key={t} className="flex items-center gap-3 rounded-xl bg-cream px-4 py-3 text-sm font-medium text-choc"><I size={18} className="text-caramel" aria-hidden />{t}</li>)}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}

export function OrderCta() {
  return (
    <Section id="order" className="relative bg-choc">
      <Heading light kicker="Order Online" title="Your Favourite Treats, Just a Click Away." sub="Order on Swiggy or Zomato, or place a custom cake order for store pickup." />
      <p className="text-center"><a href="/order-online" className="btn-gold !px-10 !py-4 text-base">Order Now</a></p>
    </Section>
  );
}

export function Cafe() {
  const facts = [['First-floor dine-in restaurant', Utensils], ['Open daily, 10 AM – 10 PM', Clock], ['Zomato Dining & District booking options, subject to availability', CalendarCheck], ['Delicious Snacks & Cakes', Wallet]];
  return (
    <Section id="cafe">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal className="lg:order-2"><Img src={SITE.images.cafe} alt="Dine-in café at Thillai Nagar" className="aspect-[4/3] rounded-[2.5rem]" /></Reveal>
        <Reveal>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-caramel">The Shop Experience</p>
          <h2 className="font-serif text-3xl font-semibold text-choc md:text-4xl">More Than a Bakery, A Place to Enjoy.</h2>
          <p className="mt-5 text-ink/75">Enjoy delicious bakery treats and freshly prepared snacks in a comfortable dine-in atmosphere at our Thillai Nagar flagship outlet.</p>
          <ul className="mt-6 space-y-3">{facts.map(([t, I]) => <li key={t} className="flex gap-3 text-sm"><I size={18} className="mt-0.5 shrink-0 text-caramel" aria-hidden />{t}</li>)}</ul>
        </Reveal>
      </div>
    </Section>
  );
}
