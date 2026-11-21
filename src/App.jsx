import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Navbar from './components/Navbar';
import { Hero, SpecialCakes, Treats, OrderCta, About, Cafe } from './components/Home';
import Branches from './components/Branches';
import Contact from './components/Contact';
import { Footer, Floaters } from './components/Footer';
import { LogoIntro, useGlobalRipple } from './components/fx';
import OrderPage from './pages/OrderPage';
import TrackPage from './pages/TrackPage';
import MenuPage from './pages/MenuPage';
import CakesPage from './pages/CakesPage';
import OrderOnlinePage from './pages/OrderOnlinePage';
import CustomCakePage from './pages/CustomCakePage';

// Homepage: the only page with the Christmas theme. The logo intro runs on every visit / refresh.
function Site() {
  const reduce = useReducedMotion();
  const [intro, setIntro] = useState(!reduce);
  return (
    <>
      {intro && <LogoIntro onDone={() => setIntro(false)} />}
      <a href="#special-cakes" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-cream focus:p-2">Skip to special cakes</a>
      <Navbar home logoHidden={intro} />
      <main>
        <Hero /><SpecialCakes /><Treats /><OrderCta /><About /><Branches /><Cafe /><Contact />
      </main>
      <Footer /><Floaters />
    </>
  );
}

// Tiny path router (no extra dependency). The Node server falls back to index.html for these paths.
function pick(path) {
  let m;
  if ((m = /^\/order\/([A-Za-z0-9_-]{20,})\/?$/.exec(path))) return ['order', <OrderPage key="o" token={m[1]} />];
  const routes = { '/track': ['track', <TrackPage key="t" />], '/menu': ['menu', <MenuPage key="m" />], '/cakes': ['cakes', <CakesPage key="c" />], '/order-online': ['oo', <OrderOnlinePage key="oo" />], '/custom-cake': ['cc', <CustomCakePage key="cc" />] };
  return routes[path.replace(/\/+$/, '')] || ['home', <Site key="h" />];
}

export default function App() {
  useGlobalRipple();
  const [name, page] = pick(window.location.pathname);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>{page}</motion.div>
    </AnimatePresence>
  );
}
