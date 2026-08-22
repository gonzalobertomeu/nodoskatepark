import { type ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { GoogleIdentity } from '../../domain/ports/google-identity-verifier';

/**
 * Wraps passport's `google` strategy for the callback route without throwing on
 * cancellation/failure (Google returning `access_denied`, or any other verify error) — the
 * controller decides how to respond (redirect to /login with a query flag) instead of Nest's
 * default AuthGuard turning it into a 401 JSON body.
 */
@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  handleRequest<TUser = GoogleIdentity>(err: unknown, user: TUser | false): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }
}
