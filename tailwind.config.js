/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090d0c',
        panel: '#111816',
        line: '#24312d',
        lime: '#c8ff32',
        mint: '#7df0bd',
        muted: '#91a09b'
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
