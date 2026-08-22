import type { PasswordResetRequest } from '../entities/password-reset-request.entity';

export interface NewPasswordResetRequestInput {
  accountId: string;
  token: string;
  expiresAt: Date;
}

export abstract class PasswordResetRepository {
  abstract create(input: NewPasswordResetRequestInput): Promise<PasswordResetRequest>;
  abstract findByToken(token: string): Promise<PasswordResetRequest | null>;
  abstract markUsed(id: string): Promise<void>;
}
