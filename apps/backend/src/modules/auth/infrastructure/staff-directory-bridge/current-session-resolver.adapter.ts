import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  CurrentSessionResolver,
  type ResolvedSession,
} from '../../../staff-directory/domain/ports/current-session-resolver';
import { type AuthenticatedRequest, SessionGuard } from '../http/session.guard';

/**
 * Implements staff-directory's CurrentSessionResolver port by wrapping auth's own SessionGuard —
 * the single source of truth for session validity (Constitution II). A fourth, independently-
 * declared adapter of the same shape already wired for skater-profile (004), skater-directory
 * (002), and instructor-assignment (003) — each consuming module owns its own port.
 */
@Injectable()
export class AuthStaffDirectorySessionResolverAdapter extends CurrentSessionResolver {
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
