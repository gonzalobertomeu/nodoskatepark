import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClassScheduleErrorCode } from '@nodoskatepark/contracts';
import type { Request } from 'express';
import { CurrentSessionResolver } from '../../domain/ports/current-session-resolver';

export interface ClassScheduleRequest extends Request {
  scheduleAccountId?: string;
  scheduleRole?: 'instructor' | 'administrador';
}

/**
 * Read access: instructor or administrador (FR-026a). A skater is rejected — the staff application
 * is not theirs (Principle VII).
 *
 * Two guards rather than one parameterised guard so the controller says, line by line, which role
 * each route demands; a role argument is too easy to forget on a new route.
 */
@Injectable()
export class ClassScheduleStaffGuard implements CanActivate {
  constructor(
    @Inject(CurrentSessionResolver) private readonly sessionResolver: CurrentSessionResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ClassScheduleRequest>();
    const session = await this.sessionResolver.resolve(request);

    if (!session) {
      throw new HttpException(
        { error: ClassScheduleErrorCode.Unauthenticated, message: 'No hay una sesión activa.' },
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (session.role === 'skater') {
      throw new HttpException(
        {
          error: ClassScheduleErrorCode.Forbidden,
          message: 'Esta sección es exclusiva del staff.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.scheduleAccountId = session.accountId;
    request.scheduleRole = session.role;
    return true;
  }
}
