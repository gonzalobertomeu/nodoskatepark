import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../shared/persistence/persistence.module';
import { AuthModule } from '../auth/auth.module';
import { AssignInstructorByEmailUseCase } from './application/use-cases/assign-instructor-by-email.use-case';
import { CancelInstructorInvitationUseCase } from './application/use-cases/cancel-instructor-invitation.use-case';
import { ConsumePendingInvitationOnAccountCreatedUseCase } from './application/use-cases/consume-pending-invitation-on-account-created.use-case';
import { ListPendingInstructorInvitationsUseCase } from './application/use-cases/list-pending-instructor-invitations.use-case';
import { PromoteExistingUserToInstructorUseCase } from './application/use-cases/promote-existing-user-to-instructor.use-case';
import { AccountLookup } from './domain/ports/account-lookup';
import { InstructorInvitationRepository } from './domain/ports/instructor-invitation.repository';
import { RoleAssignmentAuditRepository } from './domain/ports/role-assignment-audit.repository';
import { AccountCreatedListener } from './infrastructure/events/account-created.listener';
import { AdminOnlySessionGuard } from './infrastructure/http/admin-only-session.guard';
import { InstructorAssignmentController } from './infrastructure/http/instructor-assignment.controller';
import { InstructorAssignmentLoggerService } from './infrastructure/http/instructor-assignment-logger.service';
import { PrismaAccountLookup } from './infrastructure/persistence/account-lookup.repository';
import { PrismaInstructorInvitationRepository } from './infrastructure/persistence/instructor-invitation.repository';
import { PrismaRoleAssignmentAuditRepository } from './infrastructure/persistence/role-assignment-audit.repository';

@Module({
  imports: [AuthModule, PersistenceModule],
  controllers: [InstructorAssignmentController],
  providers: [
    { provide: AccountLookup, useClass: PrismaAccountLookup },
    { provide: InstructorInvitationRepository, useClass: PrismaInstructorInvitationRepository },
    { provide: RoleAssignmentAuditRepository, useClass: PrismaRoleAssignmentAuditRepository },
    AdminOnlySessionGuard,
    InstructorAssignmentLoggerService,
    PromoteExistingUserToInstructorUseCase,
    AssignInstructorByEmailUseCase,
    ConsumePendingInvitationOnAccountCreatedUseCase,
    ListPendingInstructorInvitationsUseCase,
    CancelInstructorInvitationUseCase,
    AccountCreatedListener,
  ],
})
export class InstructorAssignmentModule {}
