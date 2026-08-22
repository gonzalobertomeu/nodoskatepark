export interface PasswordResetEmail {
  to: string;
  resetUrl: string;
}

export interface VerificationEmail {
  to: string;
  verificationUrl: string;
}

export abstract class EmailSender {
  abstract sendPasswordReset(email: PasswordResetEmail): Promise<void>;
  abstract sendEmailVerification(email: VerificationEmail): Promise<void>;
}
