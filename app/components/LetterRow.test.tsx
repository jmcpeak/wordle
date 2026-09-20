import { ThemeProvider } from '@mui/material';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LetterRow from '@/components/LetterRow';
import { renderWithTheme } from '@/testUtils/renderWithTheme';
import { lightTheme } from '@/themes';

describe('LetterRow', () => {
  it('changes animation-name for consecutive shake tokens', () => {
    const { rerender } = renderWithTheme(
      <LetterRow data-testid="row" shakeToken={1} />,
    );
    const firstClassName = screen.getByTestId('row').className;

    rerender(
      <ThemeProvider theme={lightTheme}>
        <LetterRow data-testid="row" shakeToken={2} />
      </ThemeProvider>,
    );
    const secondClassName = screen.getByTestId('row').className;

    expect(secondClassName).not.toBe(firstClassName);
  });
});
