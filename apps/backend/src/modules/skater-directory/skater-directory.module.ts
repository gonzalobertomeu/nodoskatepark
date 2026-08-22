import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../shared/persistence/persistence.module';
import { AuthModule } from '../auth/auth.module';
import { GetSkaterProfileUseCase } from './application/use-cases/get-skater-profile.use-case';
import { ListSkatersUseCase } from './application/use-cases/list-skaters.use-case';
import { UpdateSkaterEditableFieldsUseCase } from './application/use-cases/update-skater-editable-fields.use-case';
import { UploadSkaterPhotoUseCase } from './application/use-cases/upload-skater-photo.use-case';
import { HealthAuditRepository } from './domain/ports/health-audit.repository';
import { LastCheckInReader } from './domain/ports/last-check-in-reader';
import { PhotoStorage } from './domain/ports/photo-storage';
import { SkaterDirectoryRepository } from './domain/ports/skater-directory.repository';
import { StubLastCheckInReader } from './infrastructure/check-in-stub/last-check-in-reader.stub';
import { SkaterDirectoryController } from './infrastructure/http/skater-directory.controller';
import { SkaterDirectoryLoggerService } from './infrastructure/http/skater-directory-logger.service';
import { StaffSessionGuard } from './infrastructure/http/staff-session.guard';
import { PrismaHealthAuditRepository } from './infrastructure/persistence/health-audit.repository';
import { PrismaSkaterDirectoryRepository } from './infrastructure/persistence/skater-directory.repository';
import { LocalDiskPhotoStorage } from './infrastructure/storage/local-disk-photo-storage';

@Module({
  imports: [AuthModule, PersistenceModule],
  controllers: [SkaterDirectoryController],
  providers: [
    { provide: SkaterDirectoryRepository, useClass: PrismaSkaterDirectoryRepository },
    { provide: HealthAuditRepository, useClass: PrismaHealthAuditRepository },
    { provide: PhotoStorage, useClass: LocalDiskPhotoStorage },
    { provide: LastCheckInReader, useClass: StubLastCheckInReader },
    StaffSessionGuard,
    SkaterDirectoryLoggerService,
    ListSkatersUseCase,
    GetSkaterProfileUseCase,
    UpdateSkaterEditableFieldsUseCase,
    UploadSkaterPhotoUseCase,
  ],
})
export class SkaterDirectoryModule {}
