module.exports = {
  darkMode: 'class',
  content: ['./software.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        claw: {
          bg: '#faf9f6',
          surface: '#ffffff',
          border: '#d7dce4',
          primary: '#c92f28',
          accent: '#c92f28',
          text: '#111827',
          muted: '#64748b'
        }
      }
    }
  },
  plugins: []
};
