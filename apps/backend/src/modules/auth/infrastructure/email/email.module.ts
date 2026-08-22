import { Module } from '@nestjs/common';
import { AppConfigModule } from '../../../../shared/config/app-config.module';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import { EmailSender } from '../../domain/ports/email-sender';
import { DevCaptureEmailSender } from './dev-capture-email-sender';
import { ResendEmailSender } from './resend-email-sender';

@Module({
  imports: [AppConfigModule],
  providers: [
    DevCaptureEmailSender,
    ResendEmailSender,
    {
      provide: EmailSender,
      useFactory: (
        config: AppConfigService,
        dev: DevCaptureEmailSender,
        resend: ResendEmailSender,
      ) => (config.emailAdapter === 'resend' ? resend : dev),
      inject: [AppConfigService, DevCaptureEmailSender, ResendEmailSender],
    },
  ],
  exports: [EmailSender, DevCaptureEmailSender],
})
export class EmailModule {}
