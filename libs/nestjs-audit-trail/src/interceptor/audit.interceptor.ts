import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { from, map, type Observable, switchMap } from 'rxjs';
import { AuditService } from '../services';
import { AUDIT_METADATA_KEY } from '../decorators';
import type { AuditTrailOptions } from '../audit-trail-options';
import { AUDIT_TRAIL_OPTIONS } from '../audit-trail-options';

const DEFAULT_CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
    @Optional()
    @Inject(AUDIT_TRAIL_OPTIONS)
    private readonly options?: AuditTrailOptions,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const options = this.reflector.get<{ action: string; entity: string }>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );
    if (!options) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<{
      headers: Record<string, string | undefined>;
      body?: unknown;
      user?: { id?: string };
    }>();
    const correlationIdHeader =
      this.options?.correlationIdHeader ?? DEFAULT_CORRELATION_ID_HEADER;
    const correlationId =
      request.headers[correlationIdHeader.toLowerCase()] ??
      request.headers[correlationIdHeader] ??
      '';
    const actorId =
      request.headers['x-actor-id'] ??
      (request.user && typeof request.user === 'object' && 'id' in request.user
        ? String((request.user as { id?: string }).id)
        : '');

    return next.handle().pipe(
      switchMap((responseBody) =>
        from(
          this.auditService.record({
            action: options.action,
            entity: options.entity,
            actorId,
            correlationId,
            payloadBefore: request.body,
            payloadAfter: responseBody,
            metadata: {},
          }),
        ).pipe(map(() => responseBody)),
      ),
    );
  }
}
