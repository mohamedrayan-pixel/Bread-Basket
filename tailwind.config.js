export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Brand colours sampled from the Bread Basket logo (orange #D65E2A, brown #5B2018)
      colors: { choc: '#5B2018', caramel: '#D65E2A', brandDark: '#C24F1E', cream: '#FFF6EA', sand: '#FBE3C8', ink: '#2B1A15', xred: '#B3202A', xgreen: '#1F5E3B', gold: '#C9A227' },
      fontFamily: { serif: ['"Playfair Display"', 'Georgia', 'serif'], sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
