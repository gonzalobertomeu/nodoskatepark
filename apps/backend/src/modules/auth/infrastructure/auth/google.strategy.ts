import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';
import { AppConfigService } from '../../../../shared/config/app-config.service';
import type { GoogleIdentity } from '../../domain/ports/google-identity-verifier';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: AppConfigService) {
    super({
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google profile did not include an email address'));
      return;
    }
    const identity: GoogleIdentity = { googleId: profile.id, email };
    done(null, identity);
  }
}
