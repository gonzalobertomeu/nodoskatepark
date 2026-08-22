import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { Session } from '../../domain/entities/session.entity';
import type { NewSessionInput } from '../../domain/ports/session.repository';
import { SessionRepository } from '../../domain/ports/session.repository';

@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: NewSessionInput): Promise<Session> {
    return this.prisma.session.create({
      data: {
        accountId: input.accountId,
        authMethod: input.authMethod,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}
