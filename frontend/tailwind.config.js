/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",   // ← THIS LINE WAS PROBABLY MISSING OR WRONG
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}