export type AccountRole = 'skater' | 'instructor' | 'administrador';
export type AccountStatus = 'active' | 'deactivated';

export interface Account {
  id: string;
  email: string;
  passwordHash: string | null;
  googleId: string | null;
  role: AccountRole;
  status: AccountStatus;
  emailVerifiedAt: Date | null;
  failedAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
