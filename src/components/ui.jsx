import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wheat } from 'lucide-react';

export function Img({ src, alt, className = '' }) {
  const [state, setState] = useState('loading');
  const show = src && state !== 'error';
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-sand to-[#EBD9C0] ${className}`}>
      {(!show || state === 'loading') && (
        <div className="absolute inset-0 grid place-items-center text-caramel/50"><Wheat size={34} aria-hidden /></div>
      )}
      {show && (
        <img src={src} alt={alt} loading="lazy" onLoad={() => setState('ok')} onError={() => setState('error')}
          className={`h-full w-full object-cover transition-opacity duration-500 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </div>
  );
}

export const Reveal = ({ children, className = '' }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }} transition={{ type: 'spring', stiffness: 90, damping: 16 }}>{children}</motion.div>
);

export const Heading = ({ kicker, title, sub, light }) => (
  <div className="mx-auto mb-12 max-w-2xl text-center">
    {kicker && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-caramel">{kicker}</p>}
    <h2 className={`font-serif text-3xl font-semibold md:text-4xl ${light ? 'text-cream' : 'text-choc'}`}>{title}</h2>
    {sub && <p className={`mt-4 ${light ? 'text-cream/80' : 'text-ink/70'}`}>{sub}</p>}
  </div>
);

export const Section = ({ id, className = '', children }) => (
  <section id={id} className={`px-5 py-20 md:py-24 ${className}`}><div className="mx-auto max-w-6xl">{children}</div></section>
);
