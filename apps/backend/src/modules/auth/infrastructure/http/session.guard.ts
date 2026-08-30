import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import { ValidateSessionUseCase } from '../../application/use-cases/validate-session.use-case';

export interface AuthenticatedRequest extends Request {
  session?: {
    id: string;
    accountId: string;
    role: 'skater' | 'instructor' | 'administrador';
    email: string;
  };
}

/**
 * Resolves the opaque session cookie via ValidateSessionUseCase and attaches the result to the
 * request. Does not itself reject unauthenticated requests — callers (e.g. GET /auth/session)
 * may treat "no session" as a valid state.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly validateSession: ValidateSessionUseCase,
    private readonly config: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    await this.resolveSession(request);
    return true;
  }

  async resolveSession(request: AuthenticatedRequest): Promise<void> {
    const cookieValue = request.cookies?.[this.config.session.cookieName];
    if (!cookieValue || typeof cookieValue !== 'string') {
      return;
    }

    const validated = await this.validateSession.execute(cookieValue);
    if (!validated) {
      return;
    }

    request.session = {
      id: cookieValue,
      accountId: validated.accountId,
      role: validated.role,
      email: validated.email,
    };
  }

  issueCookie(response: Response, sessionId: string): void {
    const maxAgeMs = this.config.session.ttlHours * 60 * 60 * 1000;
    response.cookie(this.config.session.cookieName, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: maxAgeMs,
      path: '/',
    });
  }

  clearCookie(response: Response): void {
    response.clearCookie(this.config.session.cookieName, { path: '/' });
  }
}
