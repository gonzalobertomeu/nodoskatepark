import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../shared/persistence/persistence.module';
import { AuthModule } from '../auth/auth.module';
import { DeleteScheduledClassUseCase } from './application/use-cases/delete-scheduled-class.use-case';
import { GetClassScheduleUseCase } from './application/use-cases/get-class-schedule.use-case';
import { SaveScheduledClassUseCase } from './application/use-cases/save-scheduled-class.use-case';
import { SetSkateparkDayHoursUseCase } from './application/use-cases/set-skatepark-day-hours.use-case';
import { ClassScheduleRepository } from './domain/ports/class-schedule.repository';
import { ClassScheduleController } from './infrastructure/http/class-schedule.controller';
import { ClassScheduleAdminOnlyGuard } from './infrastructure/http/class-schedule-admin-only.guard';
import { ClassScheduleStaffGuard } from './infrastructure/http/class-schedule-staff.guard';
import { PrismaClassScheduleRepository } from './infrastructure/persistence/class-schedule.repository';

@Module({
  imports: [AuthModule, PersistenceModule],
  controllers: [ClassScheduleController],
  providers: [
    { provide: ClassScheduleRepository, useClass: PrismaClassScheduleRepository },
    ClassScheduleStaffGuard,
    ClassScheduleAdminOnlyGuard,
    GetClassScheduleUseCase,
    SaveScheduledClassUseCase,
    DeleteScheduledClassUseCase,
    SetSkateparkDayHoursUseCase,
  ],
})
export class ClassScheduleModule {}
