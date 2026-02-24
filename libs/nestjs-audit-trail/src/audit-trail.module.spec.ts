import { AuditTrailModule } from './audit-trail.module';
import { AuditService } from './services';
import { AuditInterceptor } from './interceptor';
import { AUDIT_STORAGE } from './services';
import { AUDIT_TRAIL_OPTIONS } from './audit-trail-options';

describe('AuditTrailModule', () => {
  const mockStorage = { save: jest.fn(), getLastHash: jest.fn() };

  it('forRoot returns a dynamic module with storage and optional config', () => {
    const dynamic = AuditTrailModule.forRoot({ storage: mockStorage });

    expect(dynamic.module).toBe(AuditTrailModule);
    expect(dynamic.global).toBe(true);
    expect(dynamic.exports).toContain(AuditService);
    expect(dynamic.exports).toContain(AuditInterceptor);
    expect(dynamic.providers).toBeDefined();
    const providers = dynamic.providers as unknown[];
    expect(providers).toContainEqual(
      expect.objectContaining({ provide: AUDIT_STORAGE, useValue: mockStorage }),
    );
    expect(providers).toContainEqual(
      expect.objectContaining({
        provide: AUDIT_TRAIL_OPTIONS,
        useValue: expect.any(Object),
      }),
    );
  });

  it('forRoot passes correlationIdHeader into options', () => {
    const dynamic = AuditTrailModule.forRoot({
      storage: mockStorage,
      correlationIdHeader: 'x-request-id',
    });

    const optionsProvider = (dynamic.providers as unknown[]).find(
      (p: { provide?: string }) => p.provide === AUDIT_TRAIL_OPTIONS,
    ) as { useValue: { correlationIdHeader?: string } };
    expect(optionsProvider.useValue.correlationIdHeader).toBe('x-request-id');
  });
});
