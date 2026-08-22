import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { AppendHealthAuditInput } from '../../domain/ports/health-audit.repository';
import { HealthAuditRepository } from '../../domain/ports/health-audit.repository';

@Injectable()
export class PrismaHealthAuditRepository extends HealthAuditRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async append(input: AppendHealthAuditInput): Promise<void> {
    await this.prisma.skaterHealthAuditLog.create({
      data: {
        skaterAccountId: input.skaterAccountId,
        editedByAccountId: input.editedByAccountId,
      },
    });
  }
}
