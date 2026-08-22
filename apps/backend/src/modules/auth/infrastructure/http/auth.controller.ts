import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  type ConfirmPasswordResetRequest,
  confirmPasswordResetSchema,
  GOOGLE_CALLBACK_OUTCOME_QUERY_PARAM,
  GoogleCallbackOutcome,
  type LoginRequest,
  type LoginResponse,
  type LogoutResponse,
  loginRequestSchema,
  type RegisterRequest,
  type RegisterResponse,
  type RequestPasswordResetRequest,
  registerRequestSchema,
  requestPasswordResetSchema,
  type SessionResponse,
  type VerifyEmailRequest,
  verifyEmailRequestSchema,
} from '@nodoskatepark/contracts';
import type { Request, Response } from 'express';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import { ConfirmPasswordResetUseCase } from '../../application/use-cases/confirm-password-reset.use-case';
import { LoginWithCredentialsUseCase } from '../../application/use-cases/login-with-credentials.use-case';
import { LoginWithGoogleUseCase } from '../../application/use-cases/login-with-google.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RegisterAccountUseCase } from '../../application/use-cases/register-account.use-case';
import { RequestPasswordResetUseCase } from '../../application/use-cases/request-password-reset.use-case';
import { VerifyEmailUseCase } from '../../application/use-cases/verify-email.use-case';
import type { GoogleIdentity } from '../../domain/ports/google-identity-verifier';
import { GoogleCallbackGuard } from '../auth/google-callback.guard';
import { type AuthenticatedRequest, SessionGuard } from './session.guard';

interface RequestWithGoogleIdentity extends Request {
  user?: GoogleIdentity;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginWithCredentials: LoginWithCredentialsUseCase,
    private readonly loginWithGoogle: LoginWithGoogleUseCase,
    private readonly registerAccount: RegisterAccountUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly confirmPasswordReset: ConfirmPasswordResetUseCase,
    private readonly logout: LogoutUseCase,
    private readonly sessionGuard: SessionGuard,
    private readonly config: AppConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    const input = loginRequestSchema.parse(body);
    const result = await this.loginWithCredentials.execute(input);
    this.sessionGuard.issueCookie(response, result.sessionId);
    return { status: 'ok' };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  startGoogleLogin(): void {
    // Guard redirects to Google's consent screen; no handler body needed.
  }

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard)
  async googleCallback(
    @Req() request: RequestWithGoogleIdentity,
    @Res() response: Response,
  ): Promise<void> {
    const identity = request.user;
    if (!identity) {
      response.redirect(
        `${this.config.frontendUrl}/login?${GOOGLE_CALLBACK_OUTCOME_QUERY_PARAM}=${GoogleCallbackOutcome.Cancelled}`,
      );
      return;
    }

    try {
      const result = await this.loginWithGoogle.execute(identity);
      this.sessionGuard.issueCookie(response, result.sessionId);
      response.redirect(this.config.frontendUrl);
    } catch (error) {
      if (error instanceof HttpException && error.getStatus() === 403) {
        response.redirect(
          `${this.config.frontendUrl}/login?${GOOGLE_CALLBACK_OUTCOME_QUERY_PARAM}=${GoogleCallbackOutcome.AccountUnavailable}`,
        );
        return;
      }
      throw error;
    }
  }

  @Post('register')
  async register(@Body() body: RegisterRequest): Promise<RegisterResponse> {
    const input = registerRequestSchema.parse(body);
    const { accountId, email } = await this.registerAccount.execute(input);
    await this.verifyEmail.sendVerification(accountId, email);
    return { status: 'ok', emailVerificationRequired: true };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async confirmEmailVerification(@Body() body: VerifyEmailRequest): Promise<LoginResponse> {
    const input = verifyEmailRequestSchema.parse(body);
    await this.verifyEmail.execute(input.token);
    return { status: 'ok' };
  }

  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async passwordResetRequest(@Body() body: RequestPasswordResetRequest): Promise<LoginResponse> {
    const input = requestPasswordResetSchema.parse(body);
    await this.requestPasswordReset.execute(input);
    return { status: 'ok' };
  }

  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async passwordResetConfirm(@Body() body: ConfirmPasswordResetRequest): Promise<LoginResponse> {
    const input = confirmPasswordResetSchema.parse(body);
    await this.confirmPasswordReset.execute(input);
    return { status: 'ok' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SessionGuard)
  async logoutSession(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponse> {
    if (request.session) {
      await this.logout.execute(request.session.id);
    }
    this.sessionGuard.clearCookie(response);
    return { status: 'ok' };
  }

  @Get('session')
  @UseGuards(SessionGuard)
  getSession(@Req() request: AuthenticatedRequest): SessionResponse {
    if (!request.session) {
      return { authenticated: false };
    }
    return { authenticated: true, role: request.session.role };
  }
}
