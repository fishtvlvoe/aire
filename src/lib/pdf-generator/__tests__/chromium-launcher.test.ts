import { beforeEach, describe, expect, it, vi } from 'vitest';

const launchMock = vi.fn(async () => ({ close: vi.fn() }));
const executablePathMock = vi.fn(async () => '/tmp/chromium');

vi.mock('puppeteer-core', () => ({
  default: { launch: launchMock },
}));

vi.mock('@sparticuz/chromium', () => ({
  default: {
    args: ['--chromium-arg'],
    executablePath: executablePathMock,
  },
}));

describe('launchBrowser', () => {
  beforeEach(() => {
    launchMock.mockClear();
    executablePathMock.mockClear();
    delete process.env.CHROMIUM_MODE;
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
  });

  it('uses local executable path in local mode', async () => {
    process.env.CHROMIUM_MODE = 'local';
    process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/chromium';
    const { launchBrowser } = await import('../chromium-launcher');

    await launchBrowser();

    expect(launchMock).toHaveBeenCalledWith({
      headless: true,
      executablePath: '/custom/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    expect(executablePathMock).not.toHaveBeenCalled();
  });

  it('uses serverless chromium executable and args in serverless mode', async () => {
    process.env.CHROMIUM_MODE = 'serverless';
    const { launchBrowser } = await import('../chromium-launcher');

    await launchBrowser();

    expect(executablePathMock).toHaveBeenCalled();
    expect(launchMock).toHaveBeenCalledWith({
      headless: true,
      executablePath: '/tmp/chromium',
      args: ['--chromium-arg', '--disable-gpu', '--single-process'],
    });
  });
});
