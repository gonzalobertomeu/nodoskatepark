import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { SkaterDirectoryErrorCode } from '@nodoskatepark/contracts';
import type { Request } from 'express';
import { CurrentSessionResolver } from '../../domain/ports/current-session-resolver';

export interface StaffRequest extends Request {
  staffAccountId?: string;
}

/**
 * Guards every skater-directory endpoint to an authenticated staff session (instructor or
 * administrador) — FR-012: a skater account is rejected even for its own record, since this
 * feature has no self-service path at all. Resolves the session via the CurrentSessionResolver
 * port (Constitution II), not any direct dependency on the auth module.
 */
@Injectable()
export class StaffSessionGuard implements CanActivate {
  constructor(
    @Inject(CurrentSessionResolver) private readonly sessionResolver: CurrentSessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    const session = await this.sessionResolver.resolve(request);

    if (!session) {
      throw new HttpException(
        { error: SkaterDirectoryErrorCode.Unauthenticated, message: 'No hay una sesión activa.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.role === 'skater') {
      throw new HttpException(
        {
          error: SkaterDirectoryErrorCode.Forbidden,
          message: 'Esta funcionalidad es exclusiva para staff.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.staffAccountId = session.accountId;
    return true;
  }
}
