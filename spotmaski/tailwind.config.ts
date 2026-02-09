import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6', // Purple theme for Maski
        secondary: '#A78BFA',
        success: '#10B981',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};

export default config;
