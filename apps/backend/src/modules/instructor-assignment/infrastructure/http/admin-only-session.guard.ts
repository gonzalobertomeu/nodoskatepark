import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InstructorAssignmentErrorCode } from '@nodoskatepark/contracts';
import type { Request } from 'express';
import { CurrentSessionResolver } from '../../domain/ports/current-session-resolver';

export interface AdminRequest extends Request {
  adminAccountId?: string;
}

/**
 * Guards every instructor-assignment endpoint to an authenticated `administrador` session
 * specifically — FR-006 rejects `instructor` too, unlike 002's staff-wide access
 * (research.md #4).
 */
@Injectable()
export class AdminOnlySessionGuard implements CanActivate {
  constructor(
    @Inject(CurrentSessionResolver) private readonly sessionResolver: CurrentSessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const session = await this.sessionResolver.resolve(request);

    if (!session) {
      throw new HttpException(
        {
          error: InstructorAssignmentErrorCode.Unauthenticated,
          message: 'No hay una sesión activa.',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.role !== 'administrador') {
      throw new HttpException(
        {
          error: InstructorAssignmentErrorCode.Forbidden,
          message: 'Esta funcionalidad es exclusiva para administradores.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.adminAccountId = session.accountId;
    return true;
  }
}
