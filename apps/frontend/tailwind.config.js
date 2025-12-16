/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        barcode: ['"Libre Barcode 39 Text"', 'cursive'],
      },
      colors: {
        // Ana Marka Rengi (Primary - Okyanus Mavisi)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Ana Renk
          600: '#0284c7', // Hover/Aktif
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        // Kurumsal Koyu Tema Renkleri (Enterprise Dark)
        enterprise: {
          900: '#0B1120', // Sidebar / Ana Arka Plan
          800: '#0f172a', // Kart Arka Planı
          700: '#1e293b', // Border / Ayırıcılar
          600: '#334155', // Pasif Metin
          50:  '#f8fafc', // Açık Tema Arka Plan
        }
      },
      boxShadow: {
        'glow': '0 0 15px rgba(14, 165, 233, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    }
  },
  plugins: [],
}
