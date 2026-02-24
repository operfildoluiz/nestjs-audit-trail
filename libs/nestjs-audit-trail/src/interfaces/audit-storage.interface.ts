import type { AuditRecord } from '../types';

/**
 * Storage-agnostic contract for persisting audit records.
 * Adapters (e.g. @nestjs-audit-trail/typeorm) implement this interface.
 *
 * getLastHash is optional; the core supports optional chaining when building
 * the chain. If not implemented, previousHash may be omitted.
 */
export interface IAuditStorage {
  save(record: AuditRecord): Promise<void>;

  /**
   * Optional. Returns the hash of the most recently stored record for chain linking.
   * If not implemented, the core does not require it and will not call it.
   */
  getLastHash?(): Promise<string | null>;
}
