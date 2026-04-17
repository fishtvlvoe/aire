import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('child_process')>();
  return {
    ...actual,
    exec: vi.fn(),
  };
});

import { exec } from 'child_process';
import { checkCodexStatus, runCodex } from '../index';

type ExecCallback = (error: Error | null, result: { stdout: string; stderr: string }) => void;

function mockExecSuccess(stdout: string, stderr = '') {
  vi.mocked(exec).mockImplementationOnce((_cmd: string, _opts: unknown, cb?: unknown) => {
    const callback = (cb ?? _opts) as ExecCallback;
    callback(null, { stdout, stderr });
    return {} as ReturnType<typeof exec>;
  });
}

function mockExecError(message: string, stderr = '') {
  vi.mocked(exec).mockImplementationOnce((_cmd: string, _opts: unknown, cb?: unknown) => {
    const callback = (cb ?? _opts) as ExecCallback;
    const err = Object.assign(new Error(message), { stderr });
    callback(err, { stdout: '', stderr });
    return {} as ReturnType<typeof exec>;
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkCodexStatus', () => {
  it('已登入時回傳 ready（兩次 exec 都成功）', async () => {
    mockExecSuccess('codex 1.0.0');  // --version
    mockExecSuccess('__health_check__');  // exec
    const status = await checkCodexStatus();
    expect(status).toBe('ready');
  });

  it('--version 失敗時回傳 error', async () => {
    mockExecError('command not found');
    const status = await checkCodexStatus();
    expect(status).toBe('error');
  });

  it('未登入時回傳 not-logged-in', async () => {
    mockExecSuccess('codex 1.0.0');  // --version ok
    mockExecError('not logged in', 'not logged in');  // exec fails
    const status = await checkCodexStatus();
    expect(status).toBe('not-logged-in');
  });
});

describe('runCodex', () => {
  it('成功執行回傳 success: true', async () => {
    mockExecSuccess('{"key":"val"}');
    const result = await runCodex('test prompt', 5000);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{"key":"val"}');
  });

  it('執行失敗回傳 success: false', async () => {
    mockExecError('exec failed', 'some error');
    const result = await runCodex('test prompt', 5000);
    expect(result.success).toBe(false);
  });
});
