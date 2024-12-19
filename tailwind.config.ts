import type { Config } from "tailwindcss";  

const config: Config = {  
  content: [  
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",  
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",  
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",  
  ],  
  darkMode: 'class',
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
        error: '#F56565',
        success: '#48BB78',
        warning: '#ECC94B',
        info: '#4299E1',
      },  
      fontFamily: {  
        sans: ['"Inter"', 'sans-serif'],  
      },
      keyframes: {
        fadeIn: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': { 
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideIn: {
          '0%': { 
            transform: 'translateX(-100%)'
          },
          '100%': { 
            transform: 'translateX(0)'
          }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        slideIn: 'slideIn 0.5s ease-out'
      },
      backdropBlur: {
        xs: '2px',
      }
    },  
  },  
  plugins: [],  
};  

export default config;