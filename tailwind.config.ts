
import type { Config } from "tailwindcss";  

const config: Config = {  
  content: [  
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",  
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",  
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",  
  ],  
  theme: {  
    extend: {  
      colors: {  
        awsOrange: '#FF9900',  
        awsGray: '#F8F9FA',  
        primary: '#6B46C1',  
        secondary: '#B794F4',  
        background: '#F9FAFB',  
        textColor: '#2D3748',  
        accent: '#4A5568',  
      },  
      fontFamily: {  
        sans: ['"Inter"', 'sans-serif'],  
      },  
    },  
  },  
  plugins: [],  
};  

export default config;