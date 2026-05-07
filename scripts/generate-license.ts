interface CliDeps {
  log: (message: string) => void;
  error: (message: string) => void;
  fetchImpl: typeof fetch;
}

function readArg(args: string[], key: '--company' | '--expires' | '--count'): string | undefined {
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
  const countRaw = readArg(args, '--count') ?? '1';
  const count = Number.parseInt(countRaw, 10);

  if (!company || !expires) {
    deps.error('Usage: tsx scripts/generate-license.ts --company <company> --expires <iso-8601> [--count <n>]');
    return 1;
  }

  if (!isFutureIsoDate(expires)) {
    deps.error('--expires must be a future ISO 8601 date');
    return 1;
  }

  if (!Number.isInteger(count) || count < 1 || count > 500) {
    deps.error('--count must be an integer between 1 and 500');
    return 1;
  }

  const serverUrl = process.env.LICENSE_SERVER_URL ?? 'https://three-ai-license-server.vercel.app';
  const adminToken = process.env.LICENSE_ADMIN_TOKEN;

  if (!adminToken) {
    deps.error('LICENSE_ADMIN_TOKEN env var is required (see license-server .env)');
    return 1;
  }

  const expiresIso = new Date(expires).toISOString();

  const response = await deps.fetchImpl(`${serverUrl}/api/license/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ count, expiresAt: expiresIso, issuedBy: company }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    deps.error(`License Server API error: ${response.status} ${text}`);
    return 1;
  }

  const data = (await response.json()) as { items?: Array<{ licenseKey?: string }> };
  const keys = (data.items ?? []).map((item) => item.licenseKey).filter((key): key is string => !!key);

  if (keys.length === 0) {
    deps.error('License Server API response missing licenseKey');
    return 1;
  }

  for (const key of keys) {
    deps.log(key);
  }
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
