// Decorative / interaction effects. All purely visual: aria-hidden, pointer-events-none, and disabled for reduced-motion users.
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Cake, Cookie, Croissant, Wheat, Cherry } from 'lucide-react';
import { SITE } from '../data/site';

const ICONS = [Cake, Cookie, Croissant, Wheat, Cherry];
const SPOTS = [['6%', '14%', 0], ['90%', '10%', 1], ['82%', '72%', 2], ['4%', '78%', 3], ['50%', '90%', 4]];

export function FloatingBakery({ className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 hidden overflow-hidden sm:block ${className}`}>
      {SPOTS.map(([l, t, i], n) => { const I = ICONS[i]; return (
        <motion.span key={n} className="absolute text-caramel/25" style={{ left: l, top: t }}
          animate={{ y: [0, -16, 0], rotate: [-8, 8, -8] }} transition={{ duration: 5 + n, repeat: Infinity, ease: 'easeInOut', delay: n * 0.4 }}>
          <I size={34 + (n % 3) * 8} strokeWidth={1.4} />
        </motion.span>); })}
    </div>
  );
}

/** Soft glow that follows the pointer inside its parent (parent must be `relative`). */
export function MouseGlow() {
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(-300), { stiffness: 90, damping: 18 });
  const y = useSpring(useMotionValue(-300), { stiffness: 90, damping: 18 });
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.parentElement; if (!el || reduce) return;
    const move = (e) => { const r = el.getBoundingClientRect(); x.set(e.clientX - r.left - 160); y.set(e.clientY - r.top - 160); };
    el.addEventListener('pointermove', move); return () => el.removeEventListener('pointermove', move);
  }, [reduce, x, y]);
  if (reduce) return null;
  return <motion.div ref={ref} aria-hidden className="pointer-events-none absolute left-0 top-0 h-80 w-80 rounded-full bg-caramel/15 blur-3xl" style={{ x, y }} />;
}

/** Gentle 3-D tilt toward the pointer. */
export function Tilt({ children, className = '' }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0), py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 15 });
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); px.set((e.clientX - r.left) / r.width - 0.5); py.set((e.clientY - r.top) / r.height - 0.5); };
  const leave = () => { px.set(0); py.set(0); };
  return (
    <motion.div className={className} style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }} onPointerMove={reduce ? undefined : move} onPointerLeave={leave}
      whileHover={reduce ? undefined : { scale: 1.02 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>{children}</motion.div>
  );
}

/**
 * Homepage logo intro (runs on every visit / refresh): the original logo pops in with a bouncy, bubble-like reveal,
 * then glides into the header logo position. Tap anywhere to skip. Skipped for reduced-motion users.
 */
export function LogoIntro({ onDone }) {
  const [phase, setPhase] = useState('pop');
  const [target, setTarget] = useState(null);
  const [vw] = useState(() => window.innerWidth);
  const size = Math.min(vw * 0.72, 360);
  const h = size * (1107 / 1599);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = document.getElementById('nav-logo');
      if (el) { const r = el.getBoundingClientRect(); setTarget({ x: r.left + r.width / 2 - window.innerWidth / 2, y: r.top + r.height / 2 - window.innerHeight / 2, scale: r.width / size }); }
      setPhase('fly');
    }, 1150);
    return () => { clearTimeout(t); document.body.style.overflow = prev; };
  }, [size]);
  const flying = phase === 'fly';
  return (
    <motion.div className="fixed inset-0 z-[100] cursor-pointer" role="status" aria-label="Loading The Bread Basket" onClick={onDone}
      initial={{ backgroundColor: 'rgba(255,246,234,1)' }} animate={{ backgroundColor: flying ? 'rgba(255,246,234,0)' : 'rgba(255,246,234,1)' }} transition={{ duration: 0.55 }}>
      {!flying && [0, 1, 2].map((i) => (
        <motion.span key={i} aria-hidden className="absolute left-1/2 top-1/2 rounded-full border-2 border-caramel/40"
          style={{ width: size * 0.9, height: size * 0.9, marginLeft: -size * 0.45, marginTop: -size * 0.45 }}
          initial={{ scale: 0.2, opacity: 0.7 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1.3, delay: 0.15 + i * 0.22, ease: 'easeOut' }} />
      ))}
      <motion.img src={SITE.images.logo} alt="" width={size} height={h} draggable={false}
        style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -size / 2, marginTop: -h / 2 }}
        initial={{ scale: 0, opacity: 0, y: 30 }}
        animate={flying && target ? { x: target.x, y: target.y, scale: target.scale, opacity: 1 } : flying ? { opacity: 0, scale: 0.6 } : { scale: 1, opacity: 1, y: 0 }}
        transition={flying ? { duration: 0.75, ease: [0.65, 0, 0.35, 1] } : { type: 'spring', stiffness: 240, damping: 9, mass: 0.9 }}
        onAnimationComplete={() => flying && onDone()} />
    </motion.div>
  );
}

/** Material-style ripple on any .btn click (event delegation, one listener for the whole app). */
export function useGlobalRipple() {
  useEffect(() => {
    const h = (e) => {
      const b = e.target.closest?.('.btn'); if (!b || b.disabled) return;
      const r = b.getBoundingClientRect(); const d = Math.max(r.width, r.height);
      const s = document.createElement('span'); s.className = 'ripple';
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s); setTimeout(() => s.remove(), 650);
    };
    document.addEventListener('pointerdown', h); return () => document.removeEventListener('pointerdown', h);
  }, []);
}
