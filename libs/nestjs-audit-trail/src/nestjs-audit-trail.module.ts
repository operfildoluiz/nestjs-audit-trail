import { Module } from '@nestjs/common';
import { NestjsAuditTrailService } from './nestjs-audit-trail.service';

@Module({
  providers: [NestjsAuditTrailService],
  exports: [NestjsAuditTrailService],
})
export class NestjsAuditTrailModule {}
