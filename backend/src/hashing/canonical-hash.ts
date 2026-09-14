import { createHash } from 'node:crypto';

/**
 * Serializes any JavaScript object or value into canonical deterministic JSON.
 * Keys at all levels are sorted lexicographically, floats are formatted consistently,
 * and undefined / functions are handled cleanly.
 */
export function canonicalJsonStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'null';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const elements = value.map((el) => canonicalJsonStringify(el));
    return `[${elements.join(',')}]`;
  }
  if (typeof value === 'object') {
    if (value instanceof Date) {
      return JSON.stringify(value.toISOString());
    }
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs: string[] = [];
    for (const key of keys) {
      const val = (value as Record<string, unknown>)[key];
      if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
        pairs.push(`${JSON.stringify(key)}:${canonicalJsonStringify(val)}`);
      }
    }
    return `{${pairs.join(',')}}`;
  }
  return JSON.stringify(String(value));
}

/**
 * Computes SHA-256 hex digest of a raw string or buffer.
 */
export function sha256Hash(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/**
 * Computes deterministic SHA-256 hash of any canonical object.
 */
export function canonicalHash(data: unknown): string {
  const canonicalString = canonicalJsonStringify(data);
  return sha256Hash(canonicalString);
}

/**
 * Computes a Git-like forward chained hash:
 * V1: H(V1)
 * Vn: H(Canonical(Vn) + previousHash)
 */
export function computeVersionChainHash(versionData: unknown, previousHash?: string | null): string {
  const canonicalData = canonicalJsonStringify(versionData);
  if (!previousHash) {
    return sha256Hash(canonicalData);
  }
  return sha256Hash(canonicalData + '|PREV:' + previousHash);
}

/**
 * Verifies if a given hash matches the expected canonical version chain hash.
 */
export function verifyVersionHash(
  versionData: unknown,
  expectedHash: string,
  previousHash?: string | null
): boolean {
  const computed = computeVersionChainHash(versionData, previousHash);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}

export interface CanonicalBidInput {
  tenderId: string;
  vendorName: string;
  bidAmount: number | string | unknown;
  status?: string | null;
  submissionDate?: string | Date | null;
}

/**
 * Builds deterministic canonical representation of bid data.
 */
export function buildCanonicalBidPayload(input: CanonicalBidInput): Record<string, unknown> {
  return {
    tenderId: String(input.tenderId).trim(),
    vendorName: String(input.vendorName).trim(),
    bidAmount: Number(input.bidAmount),
    status: input.status ? String(input.status).trim().toUpperCase() : 'SUBMITTED',
  };
}

/**
 * Computes deterministic 64-char SHA-256 hash for a bid's canonical representation.
 */
export function computeCanonicalBidHash(input: CanonicalBidInput): string {
  const canonicalPayload = buildCanonicalBidPayload(input);
  return canonicalHash(canonicalPayload);
}
