module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './js/home-index-20260814g.js',
    './js/app-20260816a.js',
    './js/growth-paths-20260727a.js',
    './js/site-nav.js'
  ],
  safelist: [
    'bg-red-500', 'text-red-500',
    'bg-orange-500', 'text-orange-500',
    'bg-emerald-500', 'text-emerald-500',
    'bg-blue-500', 'bg-purple-500', 'bg-yellow-500',
    'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-5',
    'border-claw-primary', 'border-claw-border',
    'ring-1', 'ring-claw-primary',
    'from-claw-primary', 'to-orange-600',
    'text-claw-primary',
    'group-hover:text-claw-primary', 'group-hover:text-orange-500', 'group-hover:text-emerald-500',
    'bg-gray-50', 'bg-white', 'text-gray-900', 'text-gray-600',
    'border-gray-200', 'hover:bg-gray-100'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        claw: {
          bg: '#050505',
          surface: '#09090b',
          border: '#27272a',
          primary: '#ff453a',
          accent: '#ff6d64',
          text: '#f4f4f5',
          muted: '#a1a1aa',
          'bg-light': '#faf9f6',
          'surface-light': '#ffffff',
          'border-light': '#e2e8f0',
          'text-light': '#1e293b',
          'muted-light': '#64748b'
        }
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #18181b 1px, transparent 1px), linear-gradient(to bottom, #18181b 1px, transparent 1px)',
        'grid-pattern-light': 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)'
      }
    }
  },
  plugins: []
};
