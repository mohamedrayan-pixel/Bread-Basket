import { MapPin, Clock, Phone, Navigation, Star } from 'lucide-react';
import { BRANCHES, directionsUrl } from '../data/site';
import { Reveal, Heading, Section } from './ui';

export default function Branches() {
  return (
    <Section id="branches">
      <Heading kicker="Our Branches" title="Find a Bread Basket Near You" sub="Seven outlets across Tiruchirappalli. Opening hours are shown where confirmed." />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {BRANCHES.map((b) => (
          <Reveal key={b.name}>
            <article className={`lift flex h-full flex-col rounded-3xl p-6 ring-1 ${b.flagship ? 'bg-choc text-cream ring-choc' : 'bg-white ring-choc/10'}`}>
              {b.flagship && <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-caramel px-3 py-1 text-xs font-semibold text-white"><Star size={12} /> Flagship</span>}
              <h3 className={`font-serif text-xl ${b.flagship ? 'text-cream' : 'text-choc'}`}>{b.name}</h3>
              <p className="mt-3 flex gap-2 text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-caramel" aria-hidden />{b.address}</p>
              {b.hours && <p className="mt-2 flex gap-2 text-sm"><Clock size={16} className="mt-0.5 shrink-0 text-caramel" aria-hidden />{b.hours}</p>}
              {b.features && <p className={`mt-2 text-sm ${b.flagship ? 'text-cream/80' : 'text-ink/65'}`}>{b.features}</p>}
              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <a className={b.flagship ? 'btn-gold !py-2.5' : 'btn-primary !py-2.5'} target="_blank" rel="noopener noreferrer"
                  href={directionsUrl(`The Bread Basket, ${b.address}`)}><Navigation size={15} /> Get Directions</a>
                {b.phone && <a className="btn-outline !py-2.5" href={`tel:${b.phone.replace(/\s/g, '')}`}><Phone size={15} /> Call</a>}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
