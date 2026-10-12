/**
 * Design Tokens canónicos de re:Invent Pathfinder
 * Define paleta de colores de marca y semántica, tipografía, espaciado, radios y sombras.
 */

export const colors = {
  brand: {
    navyDark: '#0a0f1d',
    navy: '#0f172a',
    navySurface: '#1e293b',
    navyBorder: '#334155',
    orange: '#ea580c',
    orangeBright: '#f97316',
    orangeMuted: 'rgba(249, 115, 22, 0.12)',
    blue: '#0284c7',
    blueBright: '#38bdf8',
    blueMuted: 'rgba(56, 189, 248, 0.12)',
    teal: '#0f766e',
    tealBright: '#14b8a6',
    tealMuted: 'rgba(20, 184, 166, 0.12)',
  },
  semantic: {
    success: '#16a34a',
    successBg: '#f0fdf4',
    successBorder: '#bbf7d0',
    warning: '#d97706',
    warningBg: '#fffbeb',
    warningBorder: '#fde68a',
    danger: '#dc2626',
    dangerBg: '#fee2e2',
    dangerBorder: '#fecaca',
    info: '#0284c7',
    infoBg: '#f0f9ff',
    infoBorder: '#bae6fd',
  },
  neutral: {
    white: '#ffffff',
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
  },
} as const

export const typography = {
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif",
  fontFamilyMono:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
  fontSize: {
    xs: '0.75rem',
    sm: '0.85rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },
} as const

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const

export const radii = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
} as const

export const tokens = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
} as const
