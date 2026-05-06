import { describe, expect, it, vi } from 'vitest';
import { runCreateAdmin } from './create-admin';
import { DuplicateUsernameError } from '../src/lib/auth/db';

vi.mock('../src/lib/auth/db', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/auth/db')>('../src/lib/auth/db');
  return {
    ...actual,
    createUser: vi.fn(),
  };
});

const { createUser } = await import('../src/lib/auth/db');

describe('create-admin cli', () => {
  it('returns 1 and prints exact duplicate username message', async () => {
    vi.mocked(createUser).mockRejectedValueOnce(new DuplicateUsernameError());

    const logs: string[] = [];
    const errors: string[] = [];
    const code = await runCreateAdmin(['--username', 'admin', '--password', 'secret123'], {
      log: (msg) => logs.push(msg),
      error: (msg) => errors.push(msg),
    });

    expect(code).toBe(1);
    expect(logs).toEqual([]);
    expect(errors).toEqual(['Username already exists']);
  });
});
