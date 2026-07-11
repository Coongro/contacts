// Extiende el preset core para generar las utilidades cg-* que usan las vistas
// del plugin (paleta gold/sky/pink/teal/red/neutral + serif/sans + radios). Sin
// esto, las clases de color solo existirían si el host (apps/web) ya las usara;
// al shippear el CSS propio del plugin (assets.styles) la ficha rinde sola y el
// dark mode sale gratis (todas resuelven a var(--cg-*)). preflight:false evita
// duplicar el reset de Tailwind con el del host (mismo patrón que kit-veterinary).
const baseConfig = require('./tailwind-preset.cjs');

module.exports = {
  presets: [baseConfig],
  content: ['./src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
