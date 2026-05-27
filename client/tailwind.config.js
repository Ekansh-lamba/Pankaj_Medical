/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy teal palette — kept for admin/staff pages not being redesigned
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#115e59',
        },
        // New primary deep-blue brand palette
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',   // main action color
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a5f',   // dark navy — primary brand
        },
        // Warm yellow accent
        warm: {
          50:  '#fefce8',
          100: '#fef9c3',
          500: '#eab308',
        },
        // Semantic aliases
        success: '#16a34a',
        danger:  '#dc2626',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
