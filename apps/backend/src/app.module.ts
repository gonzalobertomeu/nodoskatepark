import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from './modules/auth/auth.module';
import { InstructorAssignmentModule } from './modules/instructor-assignment/instructor-assignment.module';
import { SkaterDirectoryModule } from './modules/skater-directory/skater-directory.module';
import { SkaterProfileModule } from './modules/skater-profile/skater-profile.module';
import { AppConfigModule } from './shared/config/app-config.module';

@Module({
  imports: [
    AppConfigModule,
    EventEmitterModule.forRoot(),
    AuthModule,
    SkaterProfileModule,
    SkaterDirectoryModule,
    InstructorAssignmentModule,
  ],
})
export class AppModule {}
