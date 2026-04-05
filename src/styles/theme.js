const baseTheme = {
  fonts: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    brand: "'Pacifico', cursive",
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '12px',
    xl: '18px',
    pill: '9999px',
  },
  transition: 'all 0.2s ease',
};

export const lightTheme = {
  ...baseTheme,
  colors: {
    bg: '#F9FAFB',
    bgCard: '#FFFFFF',
    bgInput: '#F9FAFB',
    bgHover: '#F3F4F6',
    bgSidebar: '#F3F4F6',

    primary: '#0F2A44',
    primaryHover: '#1F2937',
    primaryLight: 'rgba(17, 24, 39, 0.06)',
    primaryGlow: 'rgba(17, 24, 39, 0.15)',

    success: '#059669',
    successLight: 'rgba(5,150,105,0.12)',
    warning: '#D97706',
    warningLight: 'rgba(217,119,6,0.12)',
    danger: '#DC2626',
    dangerLight: 'rgba(220,38,38,0.12)',
    info: '#2563EB',
    infoLight: 'rgba(37,99,235,0.12)',

    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#9CA3AF',

    border: '#E5E7EB',
    borderFocus: '#111827',
  },
  shadows: {
    card: '0 2px 6px rgba(0,0,0,0.04)',
    modal: '0 20px 60px rgba(0,0,0,0.12)',
    button: '0 2px 6px rgba(0,0,0,0.08)',
    glow: '0 0 10px rgba(0,0,0,0.10)',
  },
};

export const darkTheme = {
  ...baseTheme,
  colors: {
    bg: '#0F172A',
    bgCard: '#1E293B',
    bgInput: '#1E293B',
    bgHover: '#293548',
    bgSidebar: '#0F172A',

    primary: '#3B82F6',
    primaryHover: '#60A5FA',
    primaryLight: 'rgba(59, 130, 246, 0.1)',
    primaryGlow: 'rgba(59, 130, 246, 0.25)',

    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    danger: '#EF4444',
    dangerLight: 'rgba(239, 68, 68, 0.15)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.15)',

    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    border: '#334155',
    borderFocus: '#3B82F6',
  },
  shadows: {
    card: '0 4px 12px rgba(0,0,0,0.3)',
    modal: '0 25px 50px rgba(0,0,0,0.5)',
    button: '0 4px 12px rgba(0,0,0,0.2)',
    glow: '0 0 15px rgba(59, 130, 246, 0.2)',
  },
};

// Default export for backward compatibility if needed, but we'll use named exports
export const theme = lightTheme;
