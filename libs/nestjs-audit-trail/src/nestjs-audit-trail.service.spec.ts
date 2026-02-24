import { Test, TestingModule } from '@nestjs/testing';
import { NestjsAuditTrailService } from './nestjs-audit-trail.service';

describe('NestjsAuditTrailService', () => {
  let service: NestjsAuditTrailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestjsAuditTrailService],
    }).compile();

    service = module.get<NestjsAuditTrailService>(NestjsAuditTrailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
