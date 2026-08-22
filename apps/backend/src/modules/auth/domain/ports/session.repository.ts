import type { Session, SessionAuthMethod } from '../entities/session.entity';

export interface NewSessionInput {
  accountId: string;
  authMethod: SessionAuthMethod;
  expiresAt: Date;
}

export abstract class SessionRepository {
  abstract create(input: NewSessionInput): Promise<Session>;
  abstract findById(id: string): Promise<Session | null>;
  abstract revoke(id: string): Promise<void>;
}
