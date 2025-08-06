import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        "xs": "321px",
        "sm": "640px",
        "lsm": "767px",
        "md": "960px",
        "mtb": "768px",
        "lmd": "825px",
        "tb": "1020px",
        "tpro": "1024px",
        "tlpro": "1025px",
        "ltm": "1080px",
        "ltAir": "1180px",
        "ltb": "1280px",
        "ltpro": "1350px",
        "lg": "1440px",
        "xl": "1536px",
        "2xl": "1600px",
        "3xl": "1800px",
        "4xl": "1900px"
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
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        // Custom colors from your dashboard
        black: {
          DEFAULT: "#000000",
          light: "#121212",
          "1": "rgba(0, 0, 0, 0.01)",
          "4": "rgba(0, 0, 0, 0.04)",
          "3": "rgba(0, 0, 0, 0.03)",
          "5": "rgba(0, 0, 0, 0.05)",
          "8": "rgba(0, 0, 0, 0.08)",
          "10": "rgba(0, 0, 0, 0.1)",
          "12": "rgba(0, 0, 0, 0.12)",
          "16": "rgba(0, 0, 0, 0.16)",
          "18": "rgba(0, 0, 0, 0.18)",
          "20": "rgba(0, 0, 0, 0.2)",
          "30": "rgba(0, 0, 0, 0.3)",
          "40": "rgba(0, 0, 0, 0.4)",
          "50": "rgba(0, 0, 0, 0.5)",
          "60": "rgba(0, 0, 0, 0.6)",
          "70": "rgba(0, 0, 0, 0.7)",
          "80": "rgba(0, 0, 0, 0.8)",
          "87": "rgba(0, 0, 0, 0.87)",
          "90": "rgba(0, 0, 0, 0.9)",
          dark: "#101828",
          lighter: "rgba(16, 24, 40, 0.6)"
        },
        gray: {
          light: "#F9FAFB",
          lighter: "#F8F9FC",
          DEFAULT: "rgba(196,196,196,1.000)",
          "2": "rgba(74, 58, 255, 0.02)",
          "4": "rgba(70, 0, 242, 0.04)",
          "8": "rgba(145, 158, 171, 0.08)",
          "20": "rgba(255, 255, 255, 0.8)",
          "30": "rgba(249, 250, 251, 1)",
          "40": "rgba(208, 213, 221, 0.4)",
          "1": "rgb(145 158 171 / 80%)",
          "60": "rgba(18, 18, 18, 0.6)",
          lightest: "#F2F4F7",
          bright: "#ECEEF1",
          "80": "var(--typography40)",
          dark_80: "rgba(58, 71, 78, 0.8)",
          light_60: " rgba(8, 8, 8, 0.60)",
          snow_drift: "rgba(248, 248, 248, 1)",
          light_mercury: "rgba(229, 229, 229, 0.8)",
          dark_mercury: "rgba(248, 245, 254, 0.40)",
          dark_3: "rgba(246, 246, 250, 1)",
          dark: "rgba(150, 147, 145, 1)",
          text: "rgba(0, 0, 0, 0.6)",
          "light-4": "#F4F4F5"
        },
        green: {
          DEFAULT: "rgba(3, 152, 85, 1)",
          dark: "#007B55",
          darker: "#027A48",
          "8": "rgba(0, 171, 85, 0.08)",
          lighter: "#ECFDF3",
          light: "rgba(45, 255, 104, 0.08)",
          "lime_green": "#3C981F"
        },
        blue: {
          DEFAULT: "rgba(29,0,102,1.000)",
          dark: "#4F25B7",
          darker: "#363F72",
          darkest: "#344054",
          darkD: "#3538CD",
          "0": "rgba(70, 0, 242, 0)",
          "1": "rgba(208,213,221,1.000)",
          "2": " rgba(70, 0, 242, 0.02)",
          "4": "rgba(70, 0, 242, 0.04)",
          "6": "rgba(70, 0, 242, 0.06)",
          "8": "rgba(70, 0, 242, 0.08)",
          "10": "rgba(70, 0, 242, 0.10)",
          "12": "rgba(74, 58, 255, 0.12)",
          "16": "rgba(70, 0, 242, 0.16)",
          "20": "rgba(70, 0, 242, 0.20)",
          "32": "rgba(69 0 242 / 32%)",
          "40": "rgba(70, 0, 242, 0.40)",
          "24": "rgba(70, 0, 242, 0.24)",
          "60": "rgba(54, 63, 114, 0.6)",
          "80": "rgba(70, 0, 242, 0.8)",
          blueGray700: "#363F72",
          light: "#4600F2",
          lighter: "#EEF4FF",
          lightest: "#4A3AFF3D",
          bright: "#1E40AF",
          brighter: "#EFF6FF",
          brightest: "#4600f20f",
          errorBoundary: "#674ee7",
          ultraLight: "#40238733",
          ultraLight2: "#402387CC",
          ultraLight3: "#402387",
          ultraBright: "rgba(70, 0, 242, 0.4)",
          "blue-16": "rgba(0, 61, 219, 0.16)",
          "light-1": "rgba(234, 240, 255, 1)",
          "light-2": "#2A0488",
          "royal_blue": "#175CD3",
          "light-40": "rgb(181, 153, 250)"
        },
        red: {
          DEFAULT: "rgba(195, 24, 18, 1)",
          lightest: "#FEF3F2",
          "1": "rgba(217, 45, 32, 1)",
          "4": "rgba(255, 0, 0, 0.04)",
          light: "rgba(242, 0, 0, 1)",
          warningRed: "#C31812",
          warningRedDark: "#C4320A",
          pinkish_red: "#EC1731"
        },
        white: {
          DEFAULT: "#ffffff",
          light: "#F0F9FF",
          lighter: "#f9f7ff",
          "15": "rgba(255, 255, 255, 0.15)",
          "16": "rgba(255, 255, 255, 0.16)",
          "8": "rgba(255, 255, 255, 0.08)",
          "6": "rgba(255, 255, 255, 0.6)",
          "10": "rgba(255, 255, 255, 0.10)",
          "20": "rgba(255, 255, 255, 0.20)",
          "60": "rgba(255, 255, 255, 0.60)",
          "24": "rgba(255, 255, 255, 0.24)",
          "70": "rgba(255, 255, 255, 0.70)",
          "80": "rgba(255, 255, 255, 0.80)",
          "100": "rgba(248, 248, 248, 1)"
        },
        blue_purple: {
          DEFAULT: "#402387",
          "1": "#1D0066",
          "4": "rgba(70, 0, 242, 0.04)",
          "8": "rgba(70, 0, 242, 0.08)",
          "12": "rgba(70, 0, 242, 0.12)",
          "20": "rgba(70, 0, 242, 0.2)",
          "40": "rgba(64, 35, 135, 0.4)",
          "60": "#40238799",
          "70": "rgba(64, 35, 135, 0.7)",
          "80": "rgba(64, 35, 135, 0.8)",
          "90": "rgba(64, 35, 135, 0.9)",
          "100": "rgba(29, 0, 102, 1)",
          dark: "rgba(70, 0, 242, 0.5)"
        },
        aqua_haze: {
          DEFAULT: "#EEF2FF",
          "1": "rgba(239, 248, 255, 1)"
        },
        cyan_blue: {
          DEFAULT: "#F0F4F9"
        },
        navy_blue: {
          DEFAULT: "#35197A",
          "1": "#f6f8fb",
          "2": "#026AA2"
        },
        orange: {
          DEFAULT: "#B54708",
          lighter: "#FFFAEB",
          "10": "rgba(254, 240, 199, 1)",
          "20": "rgba(220, 104, 3, 0.2)",
          "30": "rgba(223, 158, 24, 1)",
          "40": "rgba(214, 155, 5, 1)",
          light: "#FFF6ED",
          dark: "#D97706",
          "100": "rgba(196, 50, 10, 1)",
          sunrise_orange: "#E17141"
        },
        purple: {
          DEFAULT: "#BF2E84",
          DEFAULT_RGBA: "rgba(191, 46, 132, 0.04)",
          dark: "#402387CC",
          light: "#4600F214",
          lightPlus: "#4600F2",
          "60": "#40238799",
          "80": "rgba(64, 35, 135, 0.80)",
          "20": "rgba(64, 35, 135, 0.20)",
          banner: "#402387",
          coachMark: "#2D1E52",
          fade: "rgba(70, 0, 242, 0.4)"
        },
        purpleLight: {
          DEFAULT: "rgba(141, 78, 243, 1)",
          "40": "rgba(54, 63, 114, 0.4)",
          "80": "rgba(54, 35, 114 , 0.8)"
        },
        // Enhanced text colors for better visibility
        text: {
          primary: "rgba(0, 0, 0, 0.87)",
          secondary: "rgba(0, 0, 0, 0.6)",
          disabled: "rgba(0, 0, 0, 0.38)",
          inverse: "#ffffff"
        }
      },
      boxShadow: {
        "1xl": "0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)",
        "4xl": "0px 0px 8px rgba(0, 0, 0, 0.04), 0px 12px 24px -4px rgba(0, 0, 0, 0.04)",
        "3xl": "0px 12px 24px -4px rgba(0, 0, 0, 0.04), 0px 0px 8px 0px rgba(0, 0, 0, 0.04)",
        "2xl": "0px 0px 50px 0px rgba(70, 0, 242, 0.04)",
        "5xl": "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
        "6xl": "0px 0px 16px -4px rgba(16, 24, 40, 0.24)",
        "purple": "0px 2px 4px 0px rgba(53, 25, 122, 0.24)",
        "gray-1": "0px 0px 24px 0px rgba(0, 0, 0, 0.16)"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
