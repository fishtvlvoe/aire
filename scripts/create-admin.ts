import { createUser, DuplicateUsernameError } from '../src/lib/auth/db';

interface CliDeps {
  log: (message: string) => void;
  error: (message: string) => void;
}

function readArg(args: string[], key: '--username' | '--password'): string | undefined {
  const index = args.indexOf(key);
  if (index === -1) return undefined;
  return args[index + 1];
}

export async function runCreateAdmin(args: string[], deps: CliDeps): Promise<number> {
  const username = readArg(args, '--username');
  const password = readArg(args, '--password');

  if (!username || !password) {
    deps.error('Usage: tsx scripts/create-admin.ts --username <username> --password <password>');
    return 1;
  }

  try {
    const user = await createUser(username, password);
    deps.log(`Created admin user: ${user.username}`);
    return 0;
  } catch (error: unknown) {
    if (error instanceof DuplicateUsernameError) {
      deps.error('Username already exists');
      return 1;
    }

    if (error instanceof Error) {
      deps.error(error.message);
      return 1;
    }

    deps.error('Unknown error');
    return 1;
  }
}

async function main() {
  const exitCode = await runCreateAdmin(process.argv.slice(2), {
    log: console.log,
    error: console.error,
  });

  process.exitCode = exitCode;
}

const isDirectRun = process.argv[1]?.endsWith('create-admin.ts');
if (isDirectRun) {
  void main();
}
