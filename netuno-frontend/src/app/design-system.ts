/**
 * Design System Básico para App Netuno
 * Unifica cores, tipografia, spacing e componentes
 */

export const designTokens = {
  // Paleta de cores principal
  colors: {
    // Brand colors - tema oceano/água
    primary: {
      50: '#e6f3ff',
      100: '#b3d9ff',
      200: '#80bfff',
      300: '#4da6ff',
      400: '#1a8cff',
      500: '#0073e6', // Cor principal Netuno
      600: '#0059b3',
      700: '#004080',
      800: '#00264d',
      900: '#000d1a'
    },
    
    // Cores de apoio
    secondary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e'
    },
    
    // Status colors
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },
    
    // Neutros (grays)
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    },
    
    // Background colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
      dark: '#0f172a',
      card: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.5)'
    }
  },
  
  // Tipografia
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'monospace']
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  // Spacing
  spacing: {
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem'       // 96px
  },
  
  // Border radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px'
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};

// Utility functions
export const getColor = (colorPath: string) => {
  const keys = colorPath.split('.');
  let value: any = designTokens.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '#000000';
};

export const getSpacing = (size: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[size] || '0';
};

// Component variants
export const componentVariants = {
  button: {
    primary: {
      bg: getColor('primary.500'),
      color: 'white',
      _hover: { bg: getColor('primary.600') },
      _active: { bg: getColor('primary.700') }
    },
    secondary: {
      bg: getColor('secondary.500'),
      color: 'white',
      _hover: { bg: getColor('secondary.600') }
    },
    outline: {
      bg: 'transparent',
      color: getColor('primary.500'),
      border: `1px solid ${getColor('primary.500')}`,
      _hover: { bg: getColor('primary.50') }
    },
    ghost: {
      bg: 'transparent',
      color: getColor('gray.700'),
      _hover: { bg: getColor('gray.100') }
    }
  },
  
  card: {
    default: {
      bg: getColor('background.card'),
      border: `1px solid ${getColor('gray.200')}`,
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.boxShadow.sm,
      p: designTokens.spacing[6]
    },
    elevated: {
      bg: getColor('background.card'),
      borderRadius: designTokens.borderRadius.lg,
      boxShadow: designTokens.boxShadow.lg,
      p: designTokens.spacing[6]
    }
  },
  
  input: {
    default: {
      border: `1px solid ${getColor('gray.300')}`,
      borderRadius: designTokens.borderRadius.md,
      px: designTokens.spacing[3],
      py: designTokens.spacing[2],
      fontSize: designTokens.typography.fontSize.sm,
      _focus: {
        borderColor: getColor('primary.500'),
        outline: 'none',
        boxShadow: `0 0 0 3px ${getColor('primary.100')}`
      }
    }
  }
};