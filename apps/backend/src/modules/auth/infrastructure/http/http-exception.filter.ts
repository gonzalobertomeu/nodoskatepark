import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Structured JSON error responses + structured logging for every uncaught exception. Auth
 * use cases throw HttpException with the auth error-code bodies from
 * packages/contracts/src/auth/errors.ts; anything else is logged and reduced to a generic
 * 500 so internals never leak to the client.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (status >= 500) {
        this.logger.error(exception.message, exception.stack);
      } else {
        this.logger.warn(typeof body === 'string' ? body : JSON.stringify(body));
      }
      response.status(status).json(body);
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unknown error',
      exception instanceof Error ? exception.stack : undefined,
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'internal_error',
      message: 'An unexpected error occurred.',
    });
  }
}
