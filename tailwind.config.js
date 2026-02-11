/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#1e1e2e',
          secondary: '#181825',
          tertiary: '#313244',
          hover: '#45475a',
        },
        text: {
          primary: '#cdd6f4',
          secondary: '#a6adc8',
          muted: '#6c7086',
        },
        accent: {
          blue: '#89b4fa',
          green: '#a6e3a1',
          red: '#f38ba8',
          yellow: '#f9e2af',
          mauve: '#cba6f7',
        },
        border: '#45475a',
      },
    },
  },
  plugins: [],
}
