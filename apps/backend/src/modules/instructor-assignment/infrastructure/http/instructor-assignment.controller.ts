import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  type CancelInvitationResponse,
  InstructorAssignmentErrorCode,
  type InviteInstructorRequest,
  type InviteInstructorResponse,
  inviteInstructorRequestSchema,
  type ListPendingInvitationsResponse,
  type PromoteExistingUserResponse,
} from '@nodoskatepark/contracts';
import { AssignInstructorByEmailUseCase } from '../../application/use-cases/assign-instructor-by-email.use-case';
import {
  CancelInstructorInvitationUseCase,
  InvitationNotCancellableError,
} from '../../application/use-cases/cancel-instructor-invitation.use-case';
import { ListPendingInstructorInvitationsUseCase } from '../../application/use-cases/list-pending-instructor-invitations.use-case';
import {
  AccountNotFoundError,
  PromoteExistingUserToInstructorUseCase,
} from '../../application/use-cases/promote-existing-user-to-instructor.use-case';
import { AdminOnlySessionGuard, type AdminRequest } from './admin-only-session.guard';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Controller('instructor-assignment')
@UseGuards(AdminOnlySessionGuard)
export class InstructorAssignmentController {
  constructor(
    private readonly promoteExistingUserToInstructor: PromoteExistingUserToInstructorUseCase,
    private readonly assignInstructorByEmail: AssignInstructorByEmailUseCase,
    private readonly listPendingInvitations: ListPendingInstructorInvitationsUseCase,
    private readonly cancelInstructorInvitation: CancelInstructorInvitationUseCase,
  ) {}

  @Post('existing/:accountId')
  @HttpCode(HttpStatus.OK)
  async promoteExisting(
    @Req() request: AdminRequest,
    @Param('accountId') accountId: string,
  ): Promise<PromoteExistingUserResponse> {
    try {
      return await this.promoteExistingUserToInstructor.execute(
        accountId,
        request.adminAccountId as string,
      );
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        throw new HttpException(
          { error: InstructorAssignmentErrorCode.NotFound, message: 'Cuenta no encontrada.' },
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }

  @Post('invite')
  @HttpCode(HttpStatus.OK)
  async invite(
    @Req() request: AdminRequest,
    @Body() body: InviteInstructorRequest,
  ): Promise<InviteInstructorResponse> {
    const input = inviteInstructorRequestSchema.parse(body);
    if (!EMAIL_PATTERN.test(input.email.trim())) {
      throw new HttpException(
        { error: InstructorAssignmentErrorCode.InvalidInput, message: 'Email inválido.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.assignInstructorByEmail.execute(input.email, request.adminAccountId as string);
  }

  @Get('invitations')
  async listInvitations(): Promise<ListPendingInvitationsResponse> {
    const items = await this.listPendingInvitations.execute();
    return {
      items: items.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        createdByAdminId: invitation.createdByAdminId,
        createdAt: invitation.createdAt.toISOString(),
      })),
    };
  }

  @Post('invitations/:invitationId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelInvitation(
    @Param('invitationId') invitationId: string,
  ): Promise<CancelInvitationResponse> {
    try {
      await this.cancelInstructorInvitation.execute(invitationId);
      return { status: 'ok' };
    } catch (error) {
      if (error instanceof InvitationNotCancellableError) {
        throw new HttpException(
          { error: InstructorAssignmentErrorCode.NotFound, message: 'Invitación no encontrada.' },
          HttpStatus.NOT_FOUND,
        );
      }
      throw error;
    }
  }
}
