import { createHash } from 'node:crypto';
import type { AuditRecord } from '../types';
import { toDeterministicJson } from './serialize-deterministic';

/** Fields included in the hash; `hash` is excluded for chain integrity. */
const HASH_INPUT_KEYS: (keyof AuditRecord)[] = [
  'action',
  'actorId',
  'correlationId',
  'createdAt',
  'entity',
  'metadata',
  'payloadAfter',
  'payloadBefore',
  'previousHash',
];

/**
 * Builds the object used for hashing: same shape as AuditRecord but without `hash`,
 * so the hash is not part of its own input.
 */
function recordToHashInput(record: AuditRecord): Record<string, unknown> {
  const input: Record<string, unknown> = {};
  for (const key of HASH_INPUT_KEYS) {
    const value = record[key];
    if (value !== undefined) {
      input[key] = value;
    }
  }
  return input;
}

/**
 * Computes a deterministic SHA256 hash of an audit record.
 * Excludes the `hash` field; sorts all keys recursively before hashing.
 * Pure function; no side effects.
 */
export function computeAuditHash(record: AuditRecord): string {
  const input = recordToHashInput(record);
  const serialized = toDeterministicJson(input);
  return createHash('sha256').update(serialized, 'utf8').digest('hex');
}
