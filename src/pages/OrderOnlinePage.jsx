import { Cake, ExternalLink } from 'lucide-react';
import Page from '../components/Page';
import { Heading, Reveal, Section } from '../components/ui';
import { SITE } from '../data/site';

export default function OrderOnlinePage() {
  const ext = { target: '_blank', rel: 'noopener noreferrer' };
  const card = 'lift group flex h-full flex-col rounded-3xl p-7 text-left ring-1';
  return (
    <Page>
      <Section id="order-online" className="bg-sand">
        <Heading kicker="Order Online" title="How would you like to order?" sub="Choose a delivery app, or place a custom cake order here for store pickup." />
        <div className="grid gap-6 md:grid-cols-3">
          <Reveal><a href={SITE.swiggy} {...ext} className={`${card} bg-white ring-choc/10`}>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FC8019] font-serif text-2xl font-bold text-white" aria-hidden>S</span>
            <h2 className="mt-5 font-serif text-2xl text-choc">Order on Swiggy</h2>
            <p className="mt-2 text-sm text-ink/70">Get your favourites delivered from our Thillai Nagar outlet.</p>
            <span className="btn-primary mt-auto self-start !mt-6">Open Swiggy <ExternalLink size={15} /></span>
          </a></Reveal>
          <Reveal><a href={SITE.zomato} {...ext} className={`${card} bg-white ring-choc/10`}>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E23744] font-serif text-2xl font-bold text-white" aria-hidden>Z</span>
            <h2 className="mt-5 font-serif text-2xl text-choc">Order on Zomato</h2>
            <p className="mt-2 text-sm text-ink/70">Order from The Bread Basket on Zomato.</p>
            <span className="btn-primary mt-auto self-start !mt-6">Open Zomato <ExternalLink size={15} /></span>
          </a></Reveal>
          <Reveal><a href="/custom-cake" className={`${card} bg-choc text-cream ring-choc md:scale-[1.03]`}>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-caramel text-white"><Cake aria-hidden /></span>
            <h2 className="mt-5 font-serif text-2xl text-cream">Custom Cake Orders</h2>
            <p className="mt-2 text-sm text-cream/80">Design your own birthday cake. Store pickup only, with UPI payment on our website.</p>
            <span className="btn-gold mt-auto self-start !mt-6">Order a Custom Cake</span>
          </a></Reveal>
        </div>
      </Section>
    </Page>
  );
}
