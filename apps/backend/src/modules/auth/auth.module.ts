import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AppConfigModule } from '../../shared/config/app-config.module';
import { PersistenceModule } from '../../shared/persistence/persistence.module';
import { AccountRoleWriter } from '../instructor-assignment/domain/ports/account-role-writer';
import { CurrentSessionResolver as InstructorAssignmentCurrentSessionResolver } from '../instructor-assignment/domain/ports/current-session-resolver';
import { CurrentSessionResolver as SkaterDirectoryCurrentSessionResolver } from '../skater-directory/domain/ports/current-session-resolver';
import { CurrentSessionResolver } from '../skater-profile/domain/ports/current-session-resolver';
import { CurrentSessionResolver as StaffDirectoryCurrentSessionResolver } from '../staff-directory/domain/ports/current-session-resolver';
import { ConfirmPasswordResetUseCase } from './application/use-cases/confirm-password-reset.use-case';
import { LoginWithCredentialsUseCase } from './application/use-cases/login-with-credentials.use-case';
import { LoginWithGoogleUseCase } from './application/use-cases/login-with-google.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RegisterAccountUseCase } from './application/use-cases/register-account.use-case';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.use-case';
import { ValidateSessionUseCase } from './application/use-cases/validate-session.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { AccountRepository } from './domain/ports/account.repository';
import { PasswordHasher } from './domain/ports/password-hasher';
import { PasswordResetRepository } from './domain/ports/password-reset.repository';
import { SessionRepository } from './domain/ports/session.repository';
import { Argon2PasswordHasher } from './infrastructure/auth/argon2-password-hasher';
import { EmailVerificationToken } from './infrastructure/auth/email-verification-token';
import { GoogleStrategy } from './infrastructure/auth/google.strategy';
import { GoogleCallbackGuard } from './infrastructure/auth/google-callback.guard';
import { EmailModule } from './infrastructure/email/email.module';
import { AuthController } from './infrastructure/http/auth.controller';
import { SecurityLoggerService } from './infrastructure/http/security-logger.service';
import { SessionGuard } from './infrastructure/http/session.guard';
import { AuthAccountRoleWriterAdapter } from './infrastructure/instructor-assignment-bridge/account-role-writer.adapter';
import { AuthInstructorAssignmentSessionResolverAdapter } from './infrastructure/instructor-assignment-bridge/current-session-resolver.adapter';
import { PrismaAccountRepository } from './infrastructure/persistence/account.repository';
import { PrismaPasswordResetRepository } from './infrastructure/persistence/password-reset.repository';
import { PrismaSessionRepository } from './infrastructure/persistence/session.repository';
import { AuthSkaterDirectorySessionResolverAdapter } from './infrastructure/skater-directory-bridge/current-session-resolver.adapter';
import { AuthSessionResolverAdapter } from './infrastructure/skater-profile-bridge/current-session-resolver.adapter';
import { AuthStaffDirectorySessionResolverAdapter } from './infrastructure/staff-directory-bridge/current-session-resolver.adapter';

@Module({
  imports: [AppConfigModule, EmailModule, PassportModule, PersistenceModule],
  controllers: [AuthController],
  providers: [
    { provide: AccountRepository, useClass: PrismaAccountRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    { provide: PasswordResetRepository, useClass: PrismaPasswordResetRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: CurrentSessionResolver, useClass: AuthSessionResolverAdapter },
    {
      provide: SkaterDirectoryCurrentSessionResolver,
      useClass: AuthSkaterDirectorySessionResolverAdapter,
    },
    {
      provide: InstructorAssignmentCurrentSessionResolver,
      useClass: AuthInstructorAssignmentSessionResolverAdapter,
    },
    { provide: AccountRoleWriter, useClass: AuthAccountRoleWriterAdapter },
    {
      provide: StaffDirectoryCurrentSessionResolver,
      useClass: AuthStaffDirectorySessionResolverAdapter,
    },
    EmailVerificationToken,
    GoogleStrategy,
    GoogleCallbackGuard,
    SessionGuard,
    SecurityLoggerService,
    LoginWithCredentialsUseCase,
    LoginWithGoogleUseCase,
    RegisterAccountUseCase,
    VerifyEmailUseCase,
    RequestPasswordResetUseCase,
    ConfirmPasswordResetUseCase,
    ValidateSessionUseCase,
    LogoutUseCase,
  ],
  exports: [
    CurrentSessionResolver,
    SkaterDirectoryCurrentSessionResolver,
    InstructorAssignmentCurrentSessionResolver,
    AccountRoleWriter,
    StaffDirectoryCurrentSessionResolver,
  ],
})
export class AuthModule {}
