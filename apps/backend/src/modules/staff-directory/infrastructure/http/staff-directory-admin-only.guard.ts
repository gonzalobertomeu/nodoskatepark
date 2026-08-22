import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { StaffDirectoryErrorCode } from '@nodoskatepark/contracts';
import type { Request } from 'express';
import { CurrentSessionResolver } from '../../domain/ports/current-session-resolver';

export interface AdminRequest extends Request {
  adminAccountId?: string;
}

/**
 * Guards the staff-directory listing to an authenticated `administrador` session specifically —
 * FR-007 rejects `instructor` too, unlike 002's staff-wide access (research.md #4).
 */
@Injectable()
export class StaffDirectoryAdminOnlyGuard implements CanActivate {
  constructor(
    @Inject(CurrentSessionResolver) private readonly sessionResolver: CurrentSessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const session = await this.sessionResolver.resolve(request);

    if (!session) {
      throw new HttpException(
        { error: StaffDirectoryErrorCode.Unauthenticated, message: 'No hay una sesión activa.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.role !== 'administrador') {
      throw new HttpException(
        {
          error: StaffDirectoryErrorCode.Forbidden,
          message: 'Esta funcionalidad es exclusiva para administradores.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.adminAccountId = session.accountId;
    return true;
  }
}
