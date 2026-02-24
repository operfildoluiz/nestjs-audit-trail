import { Inject, Injectable } from '@nestjs/common';
import type { IAuditStorage } from '../interfaces';
import { computeAuditHash } from '../hashing';
import type { AuditRecord, CreateAuditInput } from '../types';

/** Injection token for the audit storage (used by AuditTrailModule.forRoot). */
export const AUDIT_STORAGE = 'AUDIT_STORAGE';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_STORAGE) private readonly storage: IAuditStorage,
  ) {}

  /**
   * Builds an audit record (hash, chain link), persists it via storage.
   * Uses storage.getLastHash?.() when available for previousHash.
   */
  async record(input: CreateAuditInput): Promise<void> {
    const previousHash = this.storage.getLastHash
      ? await this.storage.getLastHash()
      : null;
    const createdAt = new Date();
    const record: AuditRecord = {
      action: input.action,
      entity: input.entity,
      actorId: input.actorId,
      correlationId: input.correlationId,
      payloadBefore: input.payloadBefore,
      payloadAfter: input.payloadAfter,
      metadata: input.metadata ?? {},
      hash: '',
      createdAt,
      ...(previousHash !== null && { previousHash }),
    };
    record.hash = computeAuditHash(record);
    await this.storage.save(record);
  }
}
