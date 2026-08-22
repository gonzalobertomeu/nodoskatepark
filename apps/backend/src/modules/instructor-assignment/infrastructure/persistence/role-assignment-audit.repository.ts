import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import {
  type RoleAssignmentAuditEntryInput,
  RoleAssignmentAuditRepository,
} from '../../domain/ports/role-assignment-audit.repository';

@Injectable()
export class PrismaRoleAssignmentAuditRepository extends RoleAssignmentAuditRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async append(entry: RoleAssignmentAuditEntryInput): Promise<void> {
    await this.prisma.roleAssignmentAuditLog.create({
      data: {
        adminAccountId: entry.adminAccountId,
        targetAccountId: entry.targetAccountId,
        targetEmail: entry.targetEmail,
        method: entry.method,
      },
    });
  }
}
