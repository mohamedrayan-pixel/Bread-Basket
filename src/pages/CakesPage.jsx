import { Cake } from 'lucide-react';
import Page from '../components/Page';
import { Heading, Section } from '../components/ui';
import { CakeGrid } from '../components/Products';
import { SPECIAL_CAKES } from '../data/site';

export default function CakesPage() {
  return (
    <Page>
      <Section id="cakes" className="bg-sand">
        <Heading kicker="Special Cakes" title="Our 15 Special Cakes" sub="Black Forest and White Forest: ₹350 per 500g. All other cakes: ₹900 per kg. Available in 500g, 1kg, 1.5kg, 2kg, 2.5kg, 3kg or a custom size." />
        <CakeGrid cakes={SPECIAL_CAKES} />
        <p className="mt-12 text-center"><a href="/custom-cake" className="btn-gold !px-8 !py-4 text-base"><Cake size={18} /> Order a Custom Cake</a></p>
      </Section>
    </Page>
  );
}
