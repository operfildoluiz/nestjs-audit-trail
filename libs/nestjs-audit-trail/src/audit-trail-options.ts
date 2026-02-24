/**
 * Options for AuditTrailModule.forRoot.
 * Used by AuditInterceptor for correlationId header and future config.
 */
export interface AuditTrailOptions {
  /** Request header name for correlation ID. Default: 'x-correlation-id'. */
  correlationIdHeader?: string;
}

export const AUDIT_TRAIL_OPTIONS = 'AUDIT_TRAIL_OPTIONS';
