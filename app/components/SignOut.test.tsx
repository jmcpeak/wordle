import { fireEvent, screen } from '@testing-library/react';
import { signOut } from 'next-auth/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignOut from '@/components/SignOut';
import { useI18nStore } from '@/store/i18nStore';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('SignOut', () => {
  beforeEach(() => {
    vi.mocked(signOut).mockReset();
    useI18nStore.setState({
      locale: 'en-US',
      translations: {
        'auth.signOut': 'Sign Out',
      },
    });
  });

  it('signs out to the sign-in page', () => {
    renderWithTheme(<SignOut />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/signin' });
  });
});
