import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { InstructorInvitation } from '../../domain/entities';
import { InstructorInvitationRepository } from '../../domain/ports/instructor-invitation.repository';

@Injectable()
export class PrismaInstructorInvitationRepository extends InstructorInvitationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(email: string, createdByAdminId: string): Promise<InstructorInvitation> {
    const record = await this.prisma.instructorInvitation.create({
      data: { email: email.trim().toLowerCase(), createdByAdminId },
    });
    return this.toEntity(record);
  }

  async findPendingByEmail(email: string): Promise<InstructorInvitation | null> {
    const record = await this.prisma.instructorInvitation.findFirst({
      where: { email: email.trim().toLowerCase(), status: 'pending' },
    });
    return record ? this.toEntity(record) : null;
  }

  async findById(id: string): Promise<InstructorInvitation | null> {
    const record = await this.prisma.instructorInvitation.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async markCancelled(id: string): Promise<void> {
    await this.prisma.instructorInvitation.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });
  }

  async markResolved(id: string, resolvedAccountId: string): Promise<void> {
    await this.prisma.instructorInvitation.update({
      where: { id },
      data: { status: 'resolved', resolvedAccountId, resolvedAt: new Date() },
    });
  }

  async listPending(): Promise<InstructorInvitation[]> {
    const records = await this.prisma.instructorInvitation.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) => this.toEntity(record));
  }

  private toEntity(record: {
    id: string;
    email: string;
    createdByAdminId: string;
    status: string;
    createdAt: Date;
    resolvedAccountId: string | null;
    resolvedAt: Date | null;
    cancelledAt: Date | null;
  }): InstructorInvitation {
    return {
      id: record.id,
      email: record.email,
      createdByAdminId: record.createdByAdminId,
      status: record.status as InstructorInvitation['status'],
      createdAt: record.createdAt,
      resolvedAccountId: record.resolvedAccountId,
      resolvedAt: record.resolvedAt,
      cancelledAt: record.cancelledAt,
    };
  }
}
