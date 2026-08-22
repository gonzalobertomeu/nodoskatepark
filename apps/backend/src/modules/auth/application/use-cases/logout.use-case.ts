import { Inject, Injectable } from '@nestjs/common';
import type { SessionRepository as SessionRepositoryPort } from '../../domain/ports/session.repository';
import { SessionRepository } from '../../domain/ports/session.repository';

@Injectable()
export class LogoutUseCase {
  constructor(@Inject(SessionRepository) private readonly sessions: SessionRepositoryPort) {}

  async execute(sessionId: string): Promise<void> {
    await this.sessions.revoke(sessionId);
  }
}
