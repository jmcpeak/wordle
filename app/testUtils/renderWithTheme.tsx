import { CssBaseline, ThemeProvider } from '@mui/material';
import type { Theme } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { lightTheme } from '@/themes';

function withTheme(ui: ReactElement, theme: Theme) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>
  );
}

export function renderWithTheme(ui: ReactElement, theme: Theme = lightTheme) {
  const result = render(withTheme(ui, theme));
  return {
    ...result,
    rerender: (nextUi: ReactElement) =>
      result.rerender(withTheme(nextUi, theme)),
  };
}
