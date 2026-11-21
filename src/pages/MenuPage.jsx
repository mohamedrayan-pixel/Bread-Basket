import Page from '../components/Page';
import Menu from '../components/Menu';
import { Heading, Section } from '../components/ui';
import { CakeGrid, SmallGrid } from '../components/Products';
import { SPECIAL_CAKES, DONUTS, SNACKS } from '../data/site';

export default function MenuPage() {
  return (
    <Page>
      <Section id="menu-specials" className="bg-sand">
        <Heading kicker="Our Menu" title="Special Cakes" sub="Our main attraction. Cakes are priced by weight." />
        <CakeGrid cakes={SPECIAL_CAKES} />
      </Section>
      <Section id="menu-treats">
        <Heading title="Donuts" />
        <SmallGrid items={DONUTS} />
        <h2 className="mb-10 mt-16 text-center font-serif text-3xl font-semibold text-choc md:text-4xl">Chicken &amp; Egg Snacks</h2>
        <SmallGrid items={SNACKS} />
      </Section>
      <div className="bg-sand"><Menu /></div>
    </Page>
  );
}
