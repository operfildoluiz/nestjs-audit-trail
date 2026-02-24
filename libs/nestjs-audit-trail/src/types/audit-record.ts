/**
 * Pure domain type for an audit trail record.
 * No ORM or persistence annotations – storage-agnostic.
 */
export interface AuditRecord {
  action: string;
  entity: string;
  actorId: string;
  correlationId: string;
  payloadBefore: unknown;
  payloadAfter: unknown;
  metadata: Record<string, unknown>;
  hash: string;
  createdAt: Date;
  previousHash?: string;
}
