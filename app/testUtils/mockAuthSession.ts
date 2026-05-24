import type { Session } from 'next-auth';
import type { Mock } from 'vitest';

export const defaultTestSession: Session = {
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
  expires: '2099-01-01T00:00:00.000Z',
};

type AuthFn = () => Promise<Session | null>;

/** Mock `auth()`; avoids NextAuth overload resolution picking the middleware signature. */
export function mockAuthSession(
  authMock: AuthFn,
  session: Session | null = defaultTestSession,
): void {
  (authMock as Mock<AuthFn>).mockResolvedValue(session);
}
