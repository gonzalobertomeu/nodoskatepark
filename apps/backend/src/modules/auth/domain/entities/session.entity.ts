export type SessionAuthMethod = 'password' | 'google';

export interface Session {
  id: string;
  accountId: string;
  authMethod: SessionAuthMethod;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}
