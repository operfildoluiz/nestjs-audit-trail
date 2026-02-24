import { computeAuditHash } from './hash-audit';
import type { AuditRecord } from '../types';

describe('computeAuditHash', () => {
  const baseRecord: AuditRecord = {
    action: 'UPDATE',
    entity: 'User',
    actorId: 'user-1',
    correlationId: 'req-123',
    payloadBefore: { name: 'A' },
    payloadAfter: { name: 'B' },
    metadata: {},
    hash: '', // excluded from input
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  it('returns a 64-char hex string', () => {
    const h = computeAuditHash({ ...baseRecord, hash: 'any' });
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic: same input yields same hash', () => {
    const r: AuditRecord = { ...baseRecord, hash: 'ignored' };
    expect(computeAuditHash(r)).toBe(computeAuditHash(r));
  });

  it('excludes hash from calculation', () => {
    const r1: AuditRecord = { ...baseRecord, hash: 'one' };
    const r2: AuditRecord = { ...baseRecord, hash: 'two' };
    expect(computeAuditHash(r1)).toBe(computeAuditHash(r2));
  });

  it('changes when record content changes', () => {
    const h1 = computeAuditHash(baseRecord);
    const h2 = computeAuditHash({
      ...baseRecord,
      action: 'CREATE',
    });
    expect(h1).not.toBe(h2);
  });
});
