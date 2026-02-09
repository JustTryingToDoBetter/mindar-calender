import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B3D3A',
        secondary: '#F59E0B',
        success: '#0F766E',
        danger: '#E11D48',
      },
    },
  },
  plugins: [],
};

export default config;
