import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../services';
import { AUDIT_METADATA_KEY } from '../decorators';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: jest.Mocked<Pick<AuditService, 'record'>>;
  let reflector: Reflector;

  const createMockContext = (
    handler: unknown,
    request: Record<string, unknown> = {},
  ): ExecutionContext =>
    ({
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          body: undefined,
          user: undefined,
          ...request,
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    reflector = new Reflector();
  });

  it('passes through when handler has no @Audit metadata', (done) => {
    interceptor = new AuditInterceptor(
      auditService as unknown as AuditService,
      reflector,
      undefined,
    );
    const context = createMockContext(function noAudit() {});
    const next = { handle: () => of({ result: 'ok' }) };

    interceptor.intercept(context, next).subscribe({
      next: (data) => {
        expect(data).toEqual({ result: 'ok' });
        expect(auditService.record).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('calls auditService.record when handler has @Audit metadata', (done) => {
    const handler = function audited() {};
    Reflect.defineMetadata(
      AUDIT_METADATA_KEY,
      { action: 'CREATE', entity: 'User' },
      handler,
    );
    interceptor = new AuditInterceptor(
      auditService as unknown as AuditService,
      reflector,
      undefined,
    );
    const context = createMockContext(handler, {
      headers: { 'x-correlation-id': 'corr-1', 'x-actor-id': 'actor-1' },
      body: { name: 'Before' },
    });
    const next = { handle: () => of({ id: 1, name: 'After' }) };

    interceptor.intercept(context, next).subscribe({
      next: (data) => {
        expect(data).toEqual({ id: 1, name: 'After' });
        expect(auditService.record).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'CREATE',
            entity: 'User',
            correlationId: 'corr-1',
            actorId: 'actor-1',
            payloadBefore: { name: 'Before' },
            payloadAfter: { id: 1, name: 'After' },
          }),
        );
        done();
      },
    });
  });
});
