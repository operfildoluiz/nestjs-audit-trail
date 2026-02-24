import { type DynamicModule, Global, Module } from '@nestjs/common';
import type { IAuditStorage } from './interfaces';
import { AuditService, AUDIT_STORAGE } from './services';
import { AuditInterceptor } from './interceptor';
import {
  type AuditTrailOptions,
  AUDIT_TRAIL_OPTIONS,
} from './audit-trail-options';

/**
 * Options for AuditTrailModule.forRoot. Storage is required; all other fields are optional.
 */
export interface AuditTrailModuleOptions {
  /** Storage implementation (required). Adapters implement IAuditStorage. */
  storage: IAuditStorage;
  /** Request header name for correlation ID. Default: 'x-correlation-id'. */
  correlationIdHeader?: string;
}

@Global()
@Module({})
export class AuditTrailModule {
  /**
   * Registers the audit trail with mandatory storage and optional config.
   * Export AuditService and AuditInterceptor; register the interceptor
   * (e.g. APP_INTERCEPTOR or in a controller) to capture @Audit handlers.
   */
  static forRoot(options: AuditTrailModuleOptions): DynamicModule {
    const { storage, correlationIdHeader } = options;
    return {
      module: AuditTrailModule,
      global: true,
      providers: [
        { provide: AUDIT_STORAGE, useValue: storage },
        {
          provide: AUDIT_TRAIL_OPTIONS,
          useValue: { correlationIdHeader } satisfies AuditTrailOptions,
        },
        AuditService,
        AuditInterceptor,
      ],
      exports: [AuditService, AuditInterceptor],
    };
  }
}
