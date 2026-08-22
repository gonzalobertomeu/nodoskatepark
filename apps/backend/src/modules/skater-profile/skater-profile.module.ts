import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../shared/persistence/persistence.module';
import { AuthModule } from '../auth/auth.module';
import { GetMyBasicInfoUseCase } from './application/use-cases/get-my-basic-info.use-case';
import { SaveMyBasicInfoUseCase } from './application/use-cases/save-my-basic-info.use-case';
import { SkaterProfileRepository } from './domain/ports/skater-profile.repository';
import { SkaterProfileController } from './infrastructure/http/skater-profile.controller';
import { SkaterProfileLoggerService } from './infrastructure/http/skater-profile-logger.service';
import { SkaterSessionGuard } from './infrastructure/http/skater-session.guard';
import { PrismaSkaterProfileRepository } from './infrastructure/persistence/skater-profile.repository';

@Module({
  imports: [AuthModule, PersistenceModule],
  controllers: [SkaterProfileController],
  providers: [
    { provide: SkaterProfileRepository, useClass: PrismaSkaterProfileRepository },
    SkaterSessionGuard,
    SkaterProfileLoggerService,
    GetMyBasicInfoUseCase,
    SaveMyBasicInfoUseCase,
  ],
})
export class SkaterProfileModule {}
