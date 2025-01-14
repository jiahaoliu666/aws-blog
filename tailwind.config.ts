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
        sans: [
          '"Noto Sans TC"',
          '"SF Pro TC"',
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif'
        ],
        title: [
          '"Noto Serif TC"',
          '"SF Pro TC"',
          '"PingFang TC"',
          '"Microsoft JhengHei"',
          'serif'
        ],
        mono: [
          'JetBrains Mono',
          'Consolas',
          'Monaco',
          'monospace'
        ],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
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