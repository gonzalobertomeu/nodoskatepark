import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { Account } from '../../domain/entities/account.entity';
import type { NewAccountInput } from '../../domain/ports/account.repository';
import { AccountRepository } from '../../domain/ports/account.repository';

/**
 * Email uniqueness/lookup is case-insensitive per data-model.md. Postgres text columns are
 * case-sensitive by default, so we normalize to lowercase here at the persistence boundary
 * rather than adding a `citext` extension for a single column.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class PrismaAccountRepository extends AccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { email: normalizeEmail(email) } });
  }

  async findByGoogleId(googleId: string): Promise<Account | null> {
    return this.prisma.account.findUnique({ where: { googleId } });
  }

  async create(input: NewAccountInput): Promise<Account> {
    return this.prisma.account.create({
      data: {
        email: normalizeEmail(input.email),
        passwordHash: input.passwordHash,
        googleId: input.googleId,
        role: input.role,
        emailVerifiedAt: input.emailVerifiedAt,
      },
    });
  }

  async save(account: Account): Promise<Account> {
    return this.prisma.account.update({
      where: { id: account.id },
      data: {
        email: normalizeEmail(account.email),
        passwordHash: account.passwordHash,
        googleId: account.googleId,
        role: account.role,
        status: account.status,
        emailVerifiedAt: account.emailVerifiedAt,
        failedAttempts: account.failedAttempts,
        lockedUntil: account.lockedUntil,
      },
    });
  }
}
