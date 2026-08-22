import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  CurrentSessionResolver,
  type ResolvedSession,
} from '../../../skater-directory/domain/ports/current-session-resolver';
import { type AuthenticatedRequest, SessionGuard } from '../http/session.guard';

/**
 * Implements skater-directory's CurrentSessionResolver port by wrapping auth's own
 * SessionGuard — the single source of truth for session validity (Constitution II). A second,
 * independently-declared adapter of the same shape as the one already wired for skater-profile
 * (004) — each consuming module owns its own port, so this isn't logic duplication, just the
 * thin DI wrapper.
 */
@Injectable()
export class AuthSkaterDirectorySessionResolverAdapter extends CurrentSessionResolver {
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
