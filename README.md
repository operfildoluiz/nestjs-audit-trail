# nestjs-audit-trail

A small, storage-agnostic audit trail module for NestJS.

If you need a reliable record of who did what, when, and what changed - without coupling your app to a specific database or ORM - this is for you.

Records are SHA256-hashed and can be chained for tamper-evidence. You bring your own persistence layer.

## Install

```bash
npm install nestjs-audit-trail
```

## Quick start

1. Implement `IAuditStorage` (or use an adapter from a separate package).
2. Register the module and the interceptor.
3. Mark handlers with `@Audit({ action, entity })`.

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import {
  AuditTrailModule,
  AuditInterceptor,
  type IAuditStorage,
} from 'nestjs-audit-trail';

const myStorage: IAuditStorage = {
  save: async (record) => {
    // persist to your DB, queue, or object store
  },
  getLastHash: async () => null, // optional, for chain linking
};

@Module({
  imports: [
    AuditTrailModule.forRoot({
      storage: myStorage,
      correlationIdHeader: 'x-correlation-id', // optional
    }),
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
})
export class AppModule {}
```

```typescript
// user.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { Audit } from 'nestjs-audit-trail';

@Controller('users')
export class UserController {
  @Post()
  @Audit({ action: 'CREATE', entity: 'User' })
  create(@Body() body: CreateUserDto) {
    return this.userService.create(body);
  }
}
```

The interceptor reads `action` and `entity` from `@Audit`, and fills `actorId` (from `x-actor-id` or `request.user.id`), `correlationId` (from the configured header), `payloadBefore` (request body), and `payloadAfter` (handler result). Records are hashed and saved via your storage.

---

## Storage interface

All persistence is behind this contract. The core does not implement storage.

```typescript
import type { AuditRecord, IAuditStorage } from 'nestjs-audit-trail';

const adapter: IAuditStorage = {
  async save(record: AuditRecord): Promise<void> {
    // Persist record (e.g. insert into table, send to queue, write to S3).
  },

  // Optional: return the hash of the last saved record for chain linking.
  async getLastHash(): Promise<string | null> {
    return null;
  },
};
```

`AuditRecord` is a plain type: `action`, `entity`, `actorId`, `correlationId`, `payloadBefore`, `payloadAfter`, `metadata`, `hash`, `createdAt`, `previousHash?`. No ORM decorators; you map it to your schema.

---

## Building custom storage adapters

Adapters live in **separate packages** (e.g. `@nestjs-audit-trail/typeorm`, `@nestjs-audit-trail/prisma`). Your adapter only needs to implement `IAuditStorage`.

1. Create a new package that depends on `nestjs-audit-trail` and your persistence layer.
2. Implement `IAuditStorage`: in `save()`, map `AuditRecord` to your model and persist; optionally implement `getLastHash()` by reading the latest row and returning its `hash`.
3. Export a ready-to-use storage instance or factory (e.g. a function that takes a data source and returns `IAuditStorage`).
4. In the app, install the adapter and pass its storage to `AuditTrailModule.forRoot({ storage })`.

The core stays free of ORM/database imports; only NestJS and Node `crypto` are used.

---

## Domain examples

Same library, different domains: use `@Audit` with actions and entities that match your domain. Pass a storage implementation that fits your stack (SQL, NoSQL, queue, object store).

### Healthcare (e.g. PHI / HIPAA-style audit)

Audit access and changes to patient and clinical data. Use a storage backend that meets your retention and access rules.

```typescript
@Controller('patients')
export class PatientController {
  @Get(':id/records')
  @Audit({ action: 'READ', entity: 'PatientRecord' })
  getRecords(@Param('id') id: string) {
    return this.patientService.getRecords(id);
  }

  @Patch(':id')
  @Audit({ action: 'UPDATE', entity: 'Patient' })
  updatePatient(@Param('id') id: string, @Body() dto: UpdatePatientDto) {
    return this.patientService.update(id, dto);
  }

  @Post(':id/prescriptions')
  @Audit({ action: 'CREATE', entity: 'Prescription' })
  createPrescription(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.patientService.addPrescription(id, dto);
  }
}
```

### Ecommerce (orders, inventory, payments)

Audit order lifecycle, inventory changes, and payment events for support and disputes.

```typescript
@Controller('orders')
export class OrderController {
  @Post()
  @Audit({ action: 'CREATE', entity: 'Order' })
  create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Patch(':id/status')
  @Audit({ action: 'UPDATE', entity: 'Order' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.orderService.setStatus(id, body.status);
  }
}

@Controller('inventory')
export class InventoryController {
  @Patch(':sku')
  @Audit({ action: 'UPDATE', entity: 'Inventory' })
  adjust(@Param('sku') sku: string, @Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(sku, dto);
  }
}
```

### Fintech (transactions, KYC, accounts)

Audit transactions, KYC updates, and account changes for regulatory and operational traceability.

```typescript
@Controller('transactions')
export class TransactionController {
  @Post('transfer')
  @Audit({ action: 'CREATE', entity: 'Transfer' })
  transfer(@Body() dto: TransferDto) {
    return this.transferService.execute(dto);
  }
}

@Controller('accounts')
export class AccountController {
  @Patch(':id')
  @Audit({ action: 'UPDATE', entity: 'Account' })
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountService.update(id, dto);
  }
}

@Controller('kyc')
export class KycController {
  @Post('submit')
  @Audit({ action: 'SUBMIT', entity: 'KycApplication' })
  submit(@Body() dto: KycDto) {
    return this.kycService.submit(dto);
  }

  @Patch(':id/approve')
  @Audit({ action: 'APPROVE', entity: 'KycApplication' })
  approve(@Param('id') id: string) {
    return this.kycService.approve(id);
  }
}
```

### Education (enrollments, grades, courses)

Audit enrollment and grade changes for academic integrity and admin audits.

```typescript
@Controller('enrollments')
export class EnrollmentController {
  @Post()
  @Audit({ action: 'CREATE', entity: 'Enrollment' })
  enroll(@Body() dto: EnrollDto) {
    return this.enrollmentService.enroll(dto);
  }

  @Delete(':id')
  @Audit({ action: 'DELETE', entity: 'Enrollment' })
  withdraw(@Param('id') id: string) {
    return this.enrollmentService.withdraw(id);
  }
}

@Controller('grades')
export class GradeController {
  @Put(':enrollmentId')
  @Audit({ action: 'UPDATE', entity: 'Grade' })
  setGrade(@Param('enrollmentId') id: string, @Body() dto: GradeDto) {
    return this.gradeService.setGrade(id, dto);
  }
}

@Controller('courses')
export class CourseController {
  @Post()
  @Audit({ action: 'CREATE', entity: 'Course' })
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }
}
```

In every case you use the same `@Audit({ action, entity })` and one `IAuditStorage` implementation; only the semantics (and your storage backend) change per domain.

---

## Manual recording

You can skip the interceptor and record from services:

```typescript
import { AuditService } from 'nestjs-audit-trail';

@Injectable()
export class MyService {
  constructor(private readonly audit: AuditService) {}

  async doSomething(actorId: string, correlationId: string) {
    const before = { count: 0 };
    // ... work ...
    const after = { count: 1 };
    await this.audit.record({
      action: 'UPDATE',
      entity: 'Counter',
      actorId,
      correlationId,
      payloadBefore: before,
      payloadAfter: after,
    });
  }
}
```

---

## Configuration

| Option                | Required | Default              | Description                          |
| --------------------- | -------- | -------------------- | ------------------------------------ |
| `storage`             | Yes      | —                    | Your `IAuditStorage` implementation. |
| `correlationIdHeader` | No       | `'x-correlation-id'` | Request header used for correlation. |

Set `x-actor-id` on the request (or ensure `request.user.id` is set) so each record has an actor. The core uses deterministic SHA256 hashing and optional chaining via `getLastHash()`; no database or ORM is required.

---

## License

MIT
