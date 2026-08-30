import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClassScheduleErrorCode } from '@nodoskatepark/contracts';
import { CurrentSessionResolver } from '../../domain/ports/current-session-resolver';
import type { ClassScheduleRequest } from './class-schedule-staff.guard';

/**
 * Write access: administrador only (FR-026). An instructor consults the grid but does not configure
 * it, and this is where that means something: hiding the buttons is presentation, and never the
 * access control (FR-027).
 */
@Injectable()
export class ClassScheduleAdminOnlyGuard implements CanActivate {
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
    if (session.role !== 'administrador') {
      throw new HttpException(
        {
          error: ClassScheduleErrorCode.Forbidden,
          message: 'Configurar el calendario es exclusivo de administradores.',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.scheduleAccountId = session.accountId;
    request.scheduleRole = session.role;
    return true;
  }
}
