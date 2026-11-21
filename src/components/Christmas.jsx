// Homepage-only Christmas decorations. Pure CSS animation, aria-hidden, disabled for reduced-motion users.
const FLAKES = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`, size: 3 + ((i * 7) % 5), dur: 9 + ((i * 5) % 9), delay: -((i * 3) % 12), drift: ((i % 2 ? 1 : -1) * (14 + ((i * 11) % 30))),
}));

export function Snow() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLAKES.map((f, i) => (
        <span key={i} className="snowflake" style={{ left: f.left, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s`, '--drift': `${f.drift}px`, opacity: 0.85 }} />
      ))}
    </div>
  );
}

const COLORS = ['#B3202A', '#C9A227', '#1F5E3B'];
export function Garland() {
  const bulbs = Array.from({ length: 24 });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-16 h-9 overflow-hidden">
      <svg className="absolute inset-x-0 top-0 h-6 w-full" viewBox="0 0 1200 24" preserveAspectRatio="none"><path d="M0 4 Q 50 22 100 4 T 200 4 T 300 4 T 400 4 T 500 4 T 600 4 T 700 4 T 800 4 T 900 4 T 1000 4 T 1100 4 T 1200 4" fill="none" stroke="#1F5E3B" strokeWidth="3" /></svg>
      <div className="absolute inset-x-0 top-1 flex justify-between px-2">
        {bulbs.map((_, i) => <span key={i} className="bulb mt-2 block h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % 3], animationDelay: `${(i % 5) * 0.4}s`, marginTop: i % 2 ? 12 : 6, boxShadow: `0 0 8px ${COLORS[i % 3]}` }} />)}
      </div>
    </div>
  );
}

export function Ornament({ color = '#B3202A', size = 44, className = '' }) {
  return (
    <svg aria-hidden className={`swing ${className}`} width={size} height={size * 1.7} viewBox="0 0 44 75" fill="none">
      <line x1="22" y1="0" x2="22" y2="26" stroke="#C9A227" strokeWidth="1.5" />
      <rect x="17" y="24" width="10" height="6" rx="1.5" fill="#C9A227" />
      <circle cx="22" cy="48" r="18" fill={color} />
      <ellipse cx="15" cy="41" rx="5" ry="7" fill="#fff" opacity=".28" />
      <path d="M5 48 Q22 56 39 48" stroke="#C9A227" strokeWidth="2.5" fill="none" />
    </svg>
  );
}

/** Small holly sprig used as a divider in the homepage section headings. */
export const Holly = () => (
  <svg aria-hidden width="64" height="22" viewBox="0 0 64 22" className="mx-auto mb-3"><path d="M10 11c8-9 14-3 12 0-2 3-8 4-12 0Z" fill="#1F5E3B" /><path d="M54 11c-8-9-14-3-12 0 2 3 8 4 12 0Z" fill="#1F5E3B" /><circle cx="32" cy="11" r="4" fill="#B3202A" /><circle cx="26" cy="13" r="3" fill="#B3202A" /><circle cx="38" cy="13" r="3" fill="#B3202A" /></svg>
);
