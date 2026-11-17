// 🎨 BRANDING GRANAMAX

export const theme = {
  colors: {
    primary: '#22C55E',      // Verde - crescimento, dinheiro
    primaryDark: '#16A34A',  // Verde escuro
    primaryLight: '#4ADE80', // Verde claro
    
    dark: '#111827',         // Preto profissional
    darkLight: '#1F2937',    // Cinza escuro
    
    white: '#FFFFFF',
    gray: {
      50: '#F9FAFB',
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
    
    danger: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
    info: '#3B82F6',
  },
  
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
  
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
};

export type Theme = typeof theme;
