import { CssBaseline, ThemeProvider } from '@mui/material';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { lightTheme } from '@/themes';

export function renderWithTheme(ui: ReactElement) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>,
  );
}
