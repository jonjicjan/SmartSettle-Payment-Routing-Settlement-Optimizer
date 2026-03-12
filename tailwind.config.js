/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // iOS Design Tokens
        ios: {
          bg:       '#0A0A0F',
          surface:  'rgba(255,255,255,0.05)',
          violet:   '#7C3AED',
          cyan:     '#06B6D4',
          success:  '#22C55E',
          warning:  '#F59E0B',
          danger:   '#EF4444',
          fast:     '#10b981',
          standard: '#3b82f6',
          bulk:     '#f59e0b',
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background, 240 10% 5%))",
          foreground: "hsl(var(--sidebar-foreground, 0 0% 90%))",
          primary: "hsl(var(--sidebar-primary, 270 75% 56%))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground, 0 0% 98%))",
          accent: "hsl(var(--sidebar-accent, 240 10% 12%))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground, 0 0% 90%))",
          border: "hsl(var(--sidebar-border, 240 10% 14%))",
          ring: "hsl(var(--sidebar-ring, 270 75% 56%))",
        },
      },
      borderRadius: {
        '3xl': '28px',
        '2xl': '20px',
        xl:  'calc(var(--radius) + 4px)',
        lg:  'var(--radius)',
        md:  'calc(var(--radius) - 2px)',
        sm:  'calc(var(--radius) - 4px)',
        xs:  'calc(var(--radius) - 6px)',
      },
      boxShadow: {
        xs:        '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        glass:     '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glow-v':  '0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.12)',
        'glow-c':  '0 0 30px rgba(6,182,212,0.3),  0 0 60px rgba(6,182,212,0.12)',
        'card-hover': '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '40px',
        '3xl': '60px',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%":     { opacity: "0" },
        },
        "gradient-spin": {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%":     { backgroundPosition: "100% 50%" },
        },
        "float-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "shimmer": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down":   "accordion-down 0.2s ease-out",
        "accordion-up":     "accordion-up 0.2s ease-out",
        "caret-blink":      "caret-blink 1.25s ease-out infinite",
        "gradient-spin":    "gradient-spin 6s ease infinite",
        "float-up":         "float-up 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "fade-in":          "fade-in 0.4s ease forwards",
        "slide-in-left":    "slide-in-left 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "scale-in":         "scale-in 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "shimmer":          "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}