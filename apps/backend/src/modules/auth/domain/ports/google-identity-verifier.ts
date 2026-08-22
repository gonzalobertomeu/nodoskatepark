export interface GoogleIdentity {
  googleId: string;
  email: string;
}

/**
 * Marker port for the Google-verified identity shape produced by the Passport strategy
 * (infrastructure/auth/google.strategy.ts). The strategy itself performs the OAuth2 handshake;
 * this port exists so application/ use cases depend on an abstraction, not passport-google-oauth20.
 */
export abstract class GoogleIdentityVerifier {
  abstract verify(profile: unknown): GoogleIdentity;
}
