import { createHash } from 'node:crypto';

export function createLedgerHash(input: string) {
  return createHash('sha256').update(input).digest('hex');
}
