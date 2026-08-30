import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ClassScheduleErrorCode,
  dayOfWeekSchema,
  type GetClassScheduleResponse,
  type ScheduledClassInput,
  type ScheduledClassResponse,
  type SetSkateparkDayHoursRequest,
  type SkateparkDayHoursResponse,
  scheduledClassInputSchema,
  setSkateparkDayHoursRequestSchema,
} from '@nodoskatepark/contracts';
import { DeleteScheduledClassUseCase } from '../../application/use-cases/delete-scheduled-class.use-case';
import {
  DayClosedError,
  HoursChangeConflictError,
  InvalidScheduleInputError,
  OutsideOpeningHoursError,
  OverlapConflictError,
  ScheduledClassNotFoundError,
} from '../../application/use-cases/errors';
import { GetClassScheduleUseCase } from '../../application/use-cases/get-class-schedule.use-case';
import { SaveScheduledClassUseCase } from '../../application/use-cases/save-scheduled-class.use-case';
import { SetSkateparkDayHoursUseCase } from '../../application/use-cases/set-skatepark-day-hours.use-case';
import { ClassScheduleAdminOnlyGuard } from './class-schedule-admin-only.guard';
import { ClassScheduleStaffGuard } from './class-schedule-staff.guard';

/**
 * Reading is staff-wide; every write is administrador-only. The split is visible route by route on
 * purpose — see the two guards.
 */
@Controller('class-schedule')
export class ClassScheduleController {
  constructor(
    private readonly getSchedule: GetClassScheduleUseCase,
    private readonly saveClass: SaveScheduledClassUseCase,
    private readonly deleteClass: DeleteScheduledClassUseCase,
    private readonly setDayHours: SetSkateparkDayHoursUseCase,
  ) {}

  @Get()
  @UseGuards(ClassScheduleStaffGuard)
  async read(): Promise<GetClassScheduleResponse> {
    return this.getSchedule.execute();
  }

  @Post('classes')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ClassScheduleAdminOnlyGuard)
  async create(@Body() body: ScheduledClassInput): Promise<ScheduledClassResponse> {
    const input = scheduledClassInputSchema.parse(body);
    try {
      return await this.saveClass.create(input);
    } catch (error) {
      throw this.toHttp(error);
    }
  }

  @Put('classes/:id')
  @UseGuards(ClassScheduleAdminOnlyGuard)
  async update(
    @Param('id') id: string,
    @Body() body: ScheduledClassInput,
  ): Promise<ScheduledClassResponse> {
    const input = scheduledClassInputSchema.parse(body);
    try {
      return await this.saveClass.update(id, input);
    } catch (error) {
      throw this.toHttp(error);
    }
  }

  @Delete('classes/:id')
  @UseGuards(ClassScheduleAdminOnlyGuard)
  async remove(@Param('id') id: string): Promise<{ status: 'ok' }> {
    try {
      await this.deleteClass.execute(id);
      return { status: 'ok' };
    } catch (error) {
      throw this.toHttp(error);
    }
  }

  @Put('hours/:dayOfWeek')
  @UseGuards(ClassScheduleAdminOnlyGuard)
  async setHours(
    @Param('dayOfWeek') rawDay: string,
    @Body() body: SetSkateparkDayHoursRequest,
  ): Promise<SkateparkDayHoursResponse> {
    const dayOfWeek = dayOfWeekSchema.parse(rawDay);
    const input = setSkateparkDayHoursRequestSchema.parse(body);
    try {
      return await this.setDayHours.execute({
        dayOfWeek,
        closed: input.closed,
        opensAtMinute: input.closed ? null : input.opensAtMinute,
        closesAtMinute: input.closed ? null : input.closesAtMinute,
      });
    } catch (error) {
      throw this.toHttp(error);
    }
  }

  /**
   * Conflicts answer with the offending data, not just a message: FR-022 requires saying what to
   * fix, and FR-016 requires naming the classes that block an hours change.
   */
  private toHttp(error: unknown): HttpException {
    if (error instanceof OverlapConflictError) {
      return new HttpException(
        {
          error: ClassScheduleErrorCode.OverlapConflict,
          message: error.message,
          conflictingClass: error.conflictingClass,
        },
        HttpStatus.CONFLICT,
      );
    }
    if (error instanceof HoursChangeConflictError) {
      return new HttpException(
        {
          error: ClassScheduleErrorCode.OutsideOpeningHours,
          message: error.message,
          conflictingClasses: error.conflictingClasses,
        },
        HttpStatus.CONFLICT,
      );
    }
    if (error instanceof OutsideOpeningHoursError) {
      return new HttpException(
        { error: ClassScheduleErrorCode.OutsideOpeningHours, message: error.message },
        HttpStatus.CONFLICT,
      );
    }
    if (error instanceof DayClosedError) {
      return new HttpException(
        { error: ClassScheduleErrorCode.DayClosed, message: error.message },
        HttpStatus.CONFLICT,
      );
    }
    if (error instanceof ScheduledClassNotFoundError) {
      return new HttpException(
        { error: ClassScheduleErrorCode.NotFound, message: error.message },
        HttpStatus.NOT_FOUND,
      );
    }
    if (error instanceof InvalidScheduleInputError) {
      return new HttpException(
        { error: ClassScheduleErrorCode.InvalidInput, message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (error instanceof HttpException) {
      return error;
    }
    throw error;
  }
}
