import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  CurrentSessionResolver,
  type ResolvedSession,
} from '../../../class-schedule/domain/ports/current-session-resolver';
import { type AuthenticatedRequest, SessionGuard } from '../http/session.guard';

/**
 * Implements class-schedule's CurrentSessionResolver port by wrapping auth's own SessionGuard — the
 * single source of truth for session validity (Principle II). A fifth adapter of the same shape
 * already wired for 002, 003, 004 and 005.
 */
@Injectable()
export class AuthClassScheduleSessionResolverAdapter extends CurrentSessionResolver {
  constructor(private readonly sessionGuard: SessionGuard) {
    super();
  }

  async resolve(request: Request): Promise<ResolvedSession | null> {
    const authRequest = request as AuthenticatedRequest;
    await this.sessionGuard.resolveSession(authRequest);
    if (!authRequest.session) {
      return null;
    }
    return { accountId: authRequest.session.accountId, role: authRequest.session.role };
  }
}
