import { SetMetadata } from '@nestjs/common';

/** Metadata key used by AuditInterceptor to read @Audit options. */
export const AUDIT_METADATA_KEY = 'audit';

export interface AuditOptions {
  /** Audit action (e.g. CREATE, UPDATE, DELETE). */
  action: string;
  /** Entity type being audited (e.g. User, Order). */
  entity: string;
}

/**
 * Marks a handler for audit. AuditInterceptor uses action and entity
 * when recording the audit (with actorId/correlationId from request).
 */
export const Audit = (options: AuditOptions) =>
  SetMetadata(AUDIT_METADATA_KEY, options);
