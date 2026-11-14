import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: '#FACC15',
  				foreground: '#0F172A',
  				50: '#FEFCE8',
  				100: '#FEF9C3',
  				200: '#FEF08A',
  				300: '#FDE047',
  				400: '#FACC15',
  				500: '#EAB308',
  				600: '#CA8A04',
  				700: '#A16207',
  				800: '#854D0E',
  				900: '#713F12'
  			},
  			secondary: {
  				DEFAULT: '#0F172A',
  				foreground: '#F8FAFC'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: '#F1F5F9',
  				foreground: '#64748B'
  			},
  			accent: {
  				DEFAULT: '#FEF9C3',
  				foreground: '#0F172A'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: '#FFFFFF',
  				foreground: '#0F172A'
  			},
  			navy: {
  				DEFAULT: '#0F172A',
  				50: '#F8FAFC',
  				100: '#F1F5F9',
  				200: '#E2E8F0',
  				300: '#CBD5E1',
  				400: '#94A3B8',
  				500: '#64748B',
  				600: '#475569',
  				700: '#334155',
  				800: '#1E293B',
  				900: '#0F172A'
  			},
  			yellow: {
  				DEFAULT: '#FACC15',
  				50: '#FEFCE8',
  				100: '#FEF9C3',
  				200: '#FEF08A',
  				300: '#FDE047',
  				400: '#FACC15',
  				500: '#EAB308',
  				600: '#CA8A04',
  				700: '#A16207',
  				800: '#854D0E',
  				900: '#713F12'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		fontFamily: {
  			sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
  			heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  			mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
  		},
  		boxShadow: {
  			'2xs': '0 1px 2px 0px hsl(222 47% 11% / 0.03)',
  			xs: '0 1px 3px 0px hsl(222 47% 11% / 0.05)',
  			sm: '0 2px 4px -1px hsl(222 47% 11% / 0.06), 0 1px 2px -1px hsl(222 47% 11% / 0.04)',
  			DEFAULT: '0 4px 6px -1px hsl(222 47% 11% / 0.05), 0 2px 4px -2px hsl(222 47% 11% / 0.05)',
  			md: '0 10px 15px -3px hsl(222 47% 11% / 0.06), 0 4px 6px -4px hsl(222 47% 11% / 0.04)',
  			lg: '0 20px 25px -5px hsl(222 47% 11% / 0.07), 0 8px 10px -6px hsl(222 47% 11% / 0.04)',
  			xl: '0 25px 50px -12px hsl(222 47% 11% / 0.12)',
  			'2xl': '0 32px 64px -12px hsl(222 47% 11% / 0.15)',
  			card: '0 4px 20px -2px hsl(222 47% 11% / 0.08)',
  			'card-hover': '0 8px 30px -4px hsl(222 47% 11% / 0.12)'
  		},
  		borderRadius: {
  			xs: '0.375rem',
  			sm: '0.5rem',
  			DEFAULT: '0.75rem',
  			md: '0.875rem',
  			lg: '1rem',
  			xl: '1.25rem',
  			'2xl': '1.5rem',
  			'3xl': '2rem',
  			full: '9999px'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
