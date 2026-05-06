import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import type { Browser } from 'puppeteer-core';

const LOCAL_ARGS = ['--no-sandbox', '--disable-setuid-sandbox'];
const SERVERLESS_EXTRA_ARGS = ['--disable-gpu', '--single-process'];

export async function launchBrowser(): Promise<Browser> {
  const mode = process.env.CHROMIUM_MODE === 'serverless' ? 'serverless' : 'local';

  if (mode === 'local') {
    return puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
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
