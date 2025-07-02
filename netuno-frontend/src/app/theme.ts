// Design System integrado com Chakra UI v3
import { designTokens } from './design-system'

const theme = {
  colors: {
    // Brand colors - usando design system unificado
    brand: {
      50: designTokens.colors.primary[50],
      100: designTokens.colors.primary[100],
      200: designTokens.colors.primary[200],
      300: designTokens.colors.primary[300],
      400: designTokens.colors.primary[400],
      500: designTokens.colors.primary[500],
      600: designTokens.colors.primary[600],
      700: designTokens.colors.primary[700],
      800: designTokens.colors.primary[800],
      900: designTokens.colors.primary[900],
    },
    
    // Sistema de cores expandido
    primary: designTokens.colors.primary,
    secondary: designTokens.colors.secondary,
    success: designTokens.colors.success,
    warning: designTokens.colors.warning,
    error: designTokens.colors.error,
    gray: designTokens.colors.gray,
  },
  
  // Typography
  fonts: {
    body: designTokens.typography.fontFamily.sans.join(', '),
    heading: designTokens.typography.fontFamily.sans.join(', '),
    mono: designTokens.typography.fontFamily.mono.join(', ')
  },
  
  fontSizes: designTokens.typography.fontSize,
  fontWeights: designTokens.typography.fontWeight,
  lineHeights: designTokens.typography.lineHeight,
  
  // Spacing e layout
  space: designTokens.spacing,
  radii: designTokens.borderRadius,
  shadows: designTokens.boxShadow,
  
  // Breakpoints responsivos
  breakpoints: {
    sm: designTokens.breakpoints.sm,
    md: designTokens.breakpoints.md,
    lg: designTokens.breakpoints.lg,
    xl: designTokens.breakpoints.xl,
    '2xl': designTokens.breakpoints['2xl']
  },
  
  // Componentes customizados
  components: {
    Button: {
      variants: {
        primary: {
          bg: 'primary.500',
          color: 'white',
          _hover: { bg: 'primary.600' },
          _active: { bg: 'primary.700' },
          borderRadius: 'md',
          fontWeight: 'medium'
        },
        secondary: {
          bg: 'secondary.500',
          color: 'white',
          _hover: { bg: 'secondary.600' },
          borderRadius: 'md'
        },
        outline: {
          bg: 'transparent',
          color: 'primary.500',
          border: '1px solid',
          borderColor: 'primary.500',
          _hover: { bg: 'primary.50' },
          borderRadius: 'md'
        }
      }
    },
    
    Card: {
      baseStyle: {
        bg: 'white',
        borderRadius: 'lg',
        boxShadow: 'sm',
        border: '1px solid',
        borderColor: 'gray.200',
        p: 6
      }
    },
    
    Input: {
      variants: {
        outline: {
          field: {
            borderColor: 'gray.300',
            borderRadius: 'md',
            _focus: {
              borderColor: 'primary.500',
              boxShadow: `0 0 0 3px ${designTokens.colors.primary[100]}`
            }
          }
        }
      }
    }
  }
};

export { theme };