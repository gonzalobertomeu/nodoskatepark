import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SkaterProfileErrorCode } from '@nodoskatepark/contracts';
import type { Request } from 'express';
import { CurrentSessionResolver } from '../../domain/ports/current-session-resolver';

export interface SkaterRequest extends Request {
  skaterAccountId?: string;
}

/**
 * Guards both skater-profile endpoints to an authenticated `skater`-role session (FR-008: staff
 * accounts never reach this feature). Resolves the session via the CurrentSessionResolver port
 * (Constitution II) rather than any direct dependency on the auth module.
 */
@Injectable()
export class SkaterSessionGuard implements CanActivate {
  constructor(
    @Inject(CurrentSessionResolver) private readonly sessionResolver: CurrentSessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SkaterRequest>();
    const session = await this.sessionResolver.resolve(request);

    if (!session) {
      throw new HttpException(
        { error: SkaterProfileErrorCode.Unauthenticated, message: 'No hay una sesión activa.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.role !== 'skater') {
      throw new HttpException(
        {
          error: SkaterProfileErrorCode.Forbidden,
          message: 'Esta funcionalidad es exclusiva para cuentas skater.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.skaterAccountId = session.accountId;
    return true;
  }
}
