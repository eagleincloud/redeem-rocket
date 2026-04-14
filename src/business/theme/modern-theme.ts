/**
 * Modern Dark Theme for Redeem Rocket Business App
 * Based on dashboard design with premium dark purple and orange accents
 */

export const modernTheme = {
  // ── Color Palette ─────────────────────────────────────────────────────

  colors: {
    // Primary Colors
    primary: {
      50: '#FFF8F0',
      100: '#FFE8D6',
      200: '#FFD4B0',
      300: '#FFC088',
      400: '#FFAB61',
      500: '#FF9E64', // Main primary color (Orange)
      600: '#FF8C3A',
      700: '#E67E31',
      800: '#CC7129',
      900: '#B36422',
    },

    // Neutral/Background Colors
    neutral: {
      0: '#FFFFFF',
      50: '#F8F9FA',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Dark Background (Primary)
    background: {
      dark: '#0F1426', // Deep navy/dark purple
      darker: '#0A0E1A',
      card: '#1A1E3F', // Card background
      input: '#242B4D', // Input fields
      hover: '#2D3557', // Hover state
      overlay: 'rgba(15, 20, 38, 0.8)',
    },

    // Accent Colors
    accent: {
      purple: '#7C3AED', // Purple accent
      blue: '#3B82F6',   // Blue accent
      indigo: '#6366F1', // Indigo accent
    },

    // Semantic Colors
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#3B82F6',
    },

    // Status Colors
    status: {
      active: '#FF9E64',   // Orange for active
      pending: '#FBBF24',  // Amber for pending
      completed: '#10B981', // Green for completed
      error: '#EF4444',    // Red for error
      paused: '#8B5CF6',   // Purple for paused
    },
  },

  // ── Typography ────────────────────────────────────────────────────────

  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Fira Code", "Courier New", monospace',
    },

    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },

    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },

    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },

  // ── Spacing ────────────────────────────────────────────────────────────

  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },

  // ── Border Radius ────────────────────────────────────────────────────

  borderRadius: {
    none: '0',
    sm: '0.25rem',
    base: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },

  // ── Shadows ─────────────────────────────────────────────────────────

  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

    // Glow effects (premium feel)
    glow: {
      sm: '0 0 10px rgba(255, 158, 100, 0.2)',
      md: '0 0 20px rgba(255, 158, 100, 0.3)',
      lg: '0 0 30px rgba(255, 158, 100, 0.4)',
      purple: '0 0 20px rgba(124, 58, 237, 0.3)',
    },

    // Inset shadows for depth
    inset: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
  },

  // ── Transitions ─────────────────────────────────────────────────────

  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // ── Component Styles ─────────────────────────────────────────────────

  components: {
    button: {
      primary: {
        background: '#FF9E64',
        color: '#FFFFFF',
        hover: '#FF8C3A',
        active: '#E67E31',
        disabled: '#9CA3AF',
      },
      secondary: {
        background: '#242B4D',
        color: '#FF9E64',
        hover: '#2D3557',
        active: '#374151',
        disabled: '#9CA3AF',
      },
      ghost: {
        background: 'transparent',
        color: '#FF9E64',
        hover: 'rgba(255, 158, 100, 0.1)',
        active: 'rgba(255, 158, 100, 0.2)',
        disabled: '#9CA3AF',
      },
    },

    card: {
      background: '#1A1E3F',
      border: '1px solid rgba(255, 158, 100, 0.1)',
      shadow: '0 0 20px rgba(255, 158, 100, 0.2)',
    },

    input: {
      background: '#242B4D',
      border: '1px solid rgba(255, 158, 100, 0.2)',
      focus: '1px solid #FF9E64',
      placeholder: '#6B7280',
      text: '#F8F9FA',
    },

    badge: {
      success: {
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#10B981',
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.15)',
        color: '#F59E0B',
      },
      danger: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#EF4444',
      },
      info: {
        background: 'rgba(59, 130, 246, 0.15)',
        color: '#3B82F6',
      },
      default: {
        background: 'rgba(255, 158, 100, 0.15)',
        color: '#FF9E64',
      },
    },

    navbar: {
      background: '#0F1426',
      border: '1px solid rgba(255, 158, 100, 0.1)',
      text: '#F8F9FA',
    },

    sidebar: {
      background: '#0A0E1A',
      hover: '#2D3557',
      active: 'rgba(255, 158, 100, 0.2)',
      text: '#F8F9FA',
      activeText: '#FF9E64',
    },
  },

  // ── Gradient Effects ────────────────────────────────────────────────

  gradients: {
    primary: 'linear-gradient(135deg, #FF9E64 0%, #FFAB61 100%)',
    secondary: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
    dark: 'linear-gradient(135deg, #0F1426 0%, #1A1E3F 100%)',
    glow: 'linear-gradient(135deg, rgba(255, 158, 100, 0.2), rgba(124, 58, 237, 0.2))',
  },

  // ── Animation Keyframes ────────────────────────────────────────────

  animations: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideInRight: {
      from: { transform: 'translateX(100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    slideInLeft: {
      from: { transform: 'translateX(-100%)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    pulse: {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    glow: {
      '0%, 100%': { boxShadow: '0 0 5px rgba(255, 158, 100, 0.3)' },
      '50%': { boxShadow: '0 0 20px rgba(255, 158, 100, 0.6)' },
    },
  },
} as const;

// Export type for TypeScript support
export type ModernTheme = typeof modernTheme;
