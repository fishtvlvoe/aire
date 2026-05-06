interface CliDeps {
  log: (message: string) => void;
  error: (message: string) => void;
  fetchImpl: typeof fetch;
}

function readArg(args: string[], key: '--company' | '--expires'): string | undefined {
  const index = args.indexOf(key);
  if (index === -1) return undefined;
  return args[index + 1];
}

function isFutureIsoDate(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() > Date.now();
}

export async function runGenerateLicense(args: string[], deps: CliDeps): Promise<number> {
  const company = readArg(args, '--company');
  const expires = readArg(args, '--expires');

  if (!company || !expires) {
    deps.error('Usage: tsx scripts/generate-license.ts --company <company> --expires <iso-8601>');
    return 1;
  }

  if (!isFutureIsoDate(expires)) {
    deps.error('--expires must be a future ISO 8601 date');
    return 1;
  }

  const serverUrl = process.env.LICENSE_SERVER_URL ?? 'https://license.three-ai.app';

  const response = await deps.fetchImpl(`${serverUrl}/api/license/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, expires }),
  });

  if (!response.ok) {
    deps.error(`License Server API error: ${response.status}`);
    return 1;
  }

  const data = (await response.json()) as { serialKey?: string };
  if (!data.serialKey) {
    deps.error('License Server API response missing serialKey');
    return 1;
  }

  deps.log(data.serialKey);
  return 0;
}

async function main() {
  const exitCode = await runGenerateLicense(process.argv.slice(2), {
    log: console.log,
    error: console.error,
    fetchImpl: fetch,
  });
  process.exitCode = exitCode;
}

const isDirectRun = process.argv[1]?.endsWith('generate-license.ts');
if (isDirectRun) {
  void main();
}
