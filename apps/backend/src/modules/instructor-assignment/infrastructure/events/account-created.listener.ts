import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ACCOUNT_CREATED_EVENT,
  type AccountCreatedEvent,
} from '../../../../shared/events/account-created.event';
import { ConsumePendingInvitationOnAccountCreatedUseCase } from '../../application/use-cases/consume-pending-invitation-on-account-created.use-case';

/**
 * Listens for `auth`'s awaited `account.created` event (research.md #1) — the one-directional
 * link that avoids a circular module dependency between `auth` and `instructor-assignment`.
 */
@Injectable()
export class AccountCreatedListener {
  constructor(
    private readonly consumePendingInvitation: ConsumePendingInvitationOnAccountCreatedUseCase,
  ) {}

  @OnEvent(ACCOUNT_CREATED_EVENT)
  async handle(event: AccountCreatedEvent): Promise<void> {
    await this.consumePendingInvitation.execute(event.accountId, event.email);
  }
}
