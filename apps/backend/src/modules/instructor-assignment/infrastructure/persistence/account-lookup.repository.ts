import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import { AccountLookup, type AccountLookupResult } from '../../domain/ports/account-lookup';

/**
 * Local port implementation (research.md #2): reads the shared `accounts` table's
 * display/identity columns directly via the shared Prisma client — not a cross-module
 * dependency on `auth`, since `role`/`email`/`status` are read-only here.
 */
@Injectable()
export class PrismaAccountLookup extends AccountLookup {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(accountId: string): Promise<AccountLookupResult | null> {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    return account ? this.toResult(account) : null;
  }

  async findByEmail(email: string): Promise<AccountLookupResult | null> {
    const account = await this.prisma.account.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return account ? this.toResult(account) : null;
  }

  private toResult(account: {
    id: string;
    email: string;
    role: string;
    status: string;
  }): AccountLookupResult {
    return {
      accountId: account.id,
      email: account.email,
      role: account.role as AccountLookupResult['role'],
      status: account.status as AccountLookupResult['status'],
    };
  }
}
