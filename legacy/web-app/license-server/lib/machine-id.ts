import { createHash } from 'crypto';

export function hashMachineId(rawId: string): string {
  return createHash('sha256').update(rawId).digest('hex');
}
