import { CssBaseline, ThemeProvider } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { lightTheme } from '@/themes';

export function renderWithTheme(ui: ReactElement, theme: Theme = lightTheme) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
