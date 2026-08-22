import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { PasswordResetRequest } from '../../domain/entities/password-reset-request.entity';
import type { NewPasswordResetRequestInput } from '../../domain/ports/password-reset.repository';
import { PasswordResetRepository } from '../../domain/ports/password-reset.repository';

@Injectable()
export class PrismaPasswordResetRepository extends PasswordResetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(input: NewPasswordResetRequestInput): Promise<PasswordResetRequest> {
    return this.prisma.passwordResetRequest.create({
      data: {
        accountId: input.accountId,
        token: input.token,
        expiresAt: input.expiresAt,
      },
    });
  }

  async findByToken(token: string): Promise<PasswordResetRequest | null> {
    return this.prisma.passwordResetRequest.findUnique({ where: { token } });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetRequest.update({
      where: { id },
      data: { status: 'used' },
    });
  }
}
