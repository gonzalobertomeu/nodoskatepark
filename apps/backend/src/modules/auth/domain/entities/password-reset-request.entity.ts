export type PasswordResetStatus = 'pending' | 'used' | 'expired';

export interface PasswordResetRequest {
  id: string;
  accountId: string;
  token: string;
  expiresAt: Date;
  status: PasswordResetStatus;
  createdAt: Date;
}
