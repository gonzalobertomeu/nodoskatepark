import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../shared/persistence/persistence.module';
import { AuthModule } from '../auth/auth.module';
import { ListStaffUseCase } from './application/use-cases/list-staff.use-case';
import { StaffDirectoryRepository } from './domain/ports/staff-directory.repository';
import { StaffDirectoryController } from './infrastructure/http/staff-directory.controller';
import { StaffDirectoryAdminOnlyGuard } from './infrastructure/http/staff-directory-admin-only.guard';
import { PrismaStaffDirectoryRepository } from './infrastructure/persistence/staff-directory.repository';

@Module({
  imports: [AuthModule, PersistenceModule],
  controllers: [StaffDirectoryController],
  providers: [
    { provide: StaffDirectoryRepository, useClass: PrismaStaffDirectoryRepository },
    StaffDirectoryAdminOnlyGuard,
    ListStaffUseCase,
  ],
})
export class StaffDirectoryModule {}
