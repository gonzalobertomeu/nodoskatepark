import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRoleWriter } from '../../../instructor-assignment/domain/ports/account-role-writer';
import { AccountRepository } from '../../domain/ports/account.repository';

/**
 * Implements instructor-assignment's AccountRoleWriter port by wrapping auth's own
 * AccountRepository — auth remains the sole writer of Account.role (Constitution II).
 */
@Injectable()
export class AuthAccountRoleWriterAdapter extends AccountRoleWriter {
  constructor(private readonly accountRepository: AccountRepository) {
    super();
  }

  async assignInstructorRole(accountId: string): Promise<void> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    await this.accountRepository.save({ ...account, role: 'instructor' });
  }
}
