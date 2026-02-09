import { createTheme, type ThemeOptions } from '@mui/material/styles';
import type { CSSProperties } from 'react';

// Module augmentation for game-specific palette colors
declare module '@mui/material/styles' {
  interface Palette {
    game: { correct: string; present: string; absent: string };
  }
  interface PaletteOptions {
    game?: { correct: string; present: string; absent: string };
  }
  interface TypographyVariants {
    gameTitle: CSSProperties;
    letterCell: CSSProperties;
    keyboardKey: CSSProperties;
  }
  interface TypographyVariantsOptions {
    gameTitle?: CSSProperties;
    letterCell?: CSSProperties;
    keyboardKey?: CSSProperties;
  }
}

// Module augmentation for custom typography variants
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    gameTitle: true;
    letterCell: true;
    keyboardKey: true;
  }
}

const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  gameTitle: {
    fontWeight: 700,
    fontSize: '2rem',
    letterSpacing: '0.15em',
  },
  letterCell: {
    fontWeight: 700,
    fontSize: '1.25rem',
    textTransform: 'uppercase' as const,
  },
  keyboardKey: {
    fontWeight: 700,
    fontSize: '1.25rem',
  },
};

const shape = {
  borderRadius: 8,
};

const sharedComponents: ThemeOptions['components'] = {
  MuiContainer: {
    defaultProps: {
      maxWidth: 'sm',
    },
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: { vertical: 'top', horizontal: 'center' },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        textTransform: 'none',
      },
    },
  },
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      code: {
        fontFamily:
          'source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace',
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      input: {
        fontSize: '1rem',
        '&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus, &:-webkit-autofill:active':
          {
            WebkitBoxShadow: '0 0 0 100px inherit inset !important',
            WebkitTextFillColor: 'inherit !important',
            fontSize: '1rem !important',
            transition: 'background-color 5000s ease-in-out 0s',
          },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '1rem',
      },
    },
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    success: {
      main: '#6aaa64',
      dark: '#538d4e',
    },
    warning: {
      main: '#c9b458',
      dark: '#b59f3b',
    },
    grey: {
      300: '#d3d6da',
      500: '#787c7e',
    },
    text: {
      primary: '#000000',
    },
    background: {
      default: '#ffffff',
    },
    game: {
      correct: '#6aaa64',
      present: '#c9b458',
      absent: '#787c7e',
    },
  },
  shape,
  typography,
  components: sharedComponents,
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#ce93d8',
    },
    success: {
      main: '#6aaa64',
      dark: '#538d4e',
    },
    warning: {
      main: '#c9b458',
      dark: '#b59f3b',
    },
    grey: {
      300: '#3a3a3c',
      500: '#3a3a3c',
      700: '#818384',
    },
    text: {
      primary: '#ffffff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    game: {
      correct: '#6aaa64',
      present: '#c9b458',
      absent: '#3a3a3c',
    },
  },
  shape,
  typography,
  components: sharedComponents,
});
