import { Test, TestingModule } from '@nestjs/testing';
import { AuditService, AUDIT_STORAGE } from './audit.service';
import type { IAuditStorage } from '../interfaces';
import type { AuditRecord } from '../types';

describe('AuditService', () => {
  let service: AuditService;
  let storage: IAuditStorage;

  const mockStorage: IAuditStorage = {
    save: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AUDIT_STORAGE, useValue: mockStorage },
      ],
    }).compile();

    service = module.get(AuditService);
    storage = module.get(AUDIT_STORAGE);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(storage).toBe(mockStorage);
  });

  it('should save a record with computed hash and createdAt', async () => {
    await service.record({
      action: 'CREATE',
      entity: 'User',
      actorId: 'user-1',
      correlationId: 'req-1',
      payloadAfter: { name: 'Test' },
      metadata: { ip: '127.0.0.1' },
    });

    expect(mockStorage.save).toHaveBeenCalledTimes(1);
    const saved = (mockStorage.save as jest.Mock).mock.calls[0][0] as AuditRecord;
    expect(saved.action).toBe('CREATE');
    expect(saved.entity).toBe('User');
    expect(saved.actorId).toBe('user-1');
    expect(saved.correlationId).toBe('req-1');
    expect(saved.payloadAfter).toEqual({ name: 'Test' });
    expect(saved.metadata).toEqual({ ip: '127.0.0.1' });
    expect(saved.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(saved.createdAt).toBeInstanceOf(Date);
  });

  it('should set previousHash when storage.getLastHash is implemented', async () => {
    const withGetLastHash: IAuditStorage = {
      ...mockStorage,
      getLastHash: jest.fn().mockResolvedValue('previous-hash-hex'),
    };
    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AUDIT_STORAGE, useValue: withGetLastHash },
      ],
    }).compile();
    const auditService = module.get(AuditService);

    await auditService.record({
      action: 'UPDATE',
      entity: 'User',
      actorId: 'user-1',
      correlationId: 'req-2',
    });

    expect(withGetLastHash.getLastHash).toHaveBeenCalled();
    const saved = (withGetLastHash.save as jest.Mock).mock.calls[0][0] as AuditRecord;
    expect(saved.previousHash).toBe('previous-hash-hex');
  });

  it('should not set previousHash when storage.getLastHash is not implemented', async () => {
    await service.record({
      action: 'DELETE',
      entity: 'User',
      actorId: 'user-1',
      correlationId: 'req-3',
    });

    const saved = (mockStorage.save as jest.Mock).mock.calls[0][0] as AuditRecord;
    expect(saved.previousHash).toBeUndefined();
  });
});
