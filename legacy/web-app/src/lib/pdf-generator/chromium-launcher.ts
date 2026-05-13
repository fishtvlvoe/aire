import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';
import fs from 'fs';

const LOCAL_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];
const SERVERLESS_EXTRA_ARGS = ['--disable-gpu', '--single-process'];

const MAC_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

function resolveLocalExecutable(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform === 'darwin') {
    const found = MAC_CHROME_PATHS.find((p) => fs.existsSync(p));
    if (found) return found;
  }
  return '/usr/bin/chromium';
}

export async function launchBrowser(): Promise<Browser> {
  const mode = process.env.CHROMIUM_MODE === 'serverless' ? 'serverless' : 'local';

  if (mode === 'local') {
    return puppeteer.launch({
      headless: true,
      executablePath: resolveLocalExecutable(),
      args: LOCAL_ARGS,
    });
  }

  const executablePath = await chromium.executablePath();
  return puppeteer.launch({
    headless: true,
    executablePath,
    args: [...chromium.args, ...SERVERLESS_EXTRA_ARGS],
  });
}
