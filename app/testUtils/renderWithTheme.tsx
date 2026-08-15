import { CssBaseline, ThemeProvider } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { lightTheme } from '@/themes';

export function renderWithTheme(ui: ReactElement, theme: Theme = lightTheme) {
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>,
  );
}
