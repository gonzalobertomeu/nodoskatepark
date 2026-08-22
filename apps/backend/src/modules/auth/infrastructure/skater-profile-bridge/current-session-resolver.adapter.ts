import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  CurrentSessionResolver,
  type ResolvedSession,
} from '../../../skater-profile/domain/ports/current-session-resolver';
import { type AuthenticatedRequest, SessionGuard } from '../http/session.guard';

/**
 * Implements skater-profile's CurrentSessionResolver port by wrapping auth's own SessionGuard —
 * the single source of truth for session validity (Constitution II: auth keeps owning session
 * logic exclusively; skater-profile depends only on this port, never on SessionGuard directly).
 */
@Injectable()
export class AuthSessionResolverAdapter extends CurrentSessionResolver {
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
