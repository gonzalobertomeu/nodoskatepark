import type { Request } from 'express';

export interface ResolvedSession {
  accountId: string;
  role: 'skater' | 'instructor' | 'administrador';
}

/**
 * Cross-module port (Constitution II): skater-profile declares this abstraction for what it
 * needs from auth ("who is the current session"), and the auth module provides + exports the
 * concrete implementation. skater-profile never imports auth's domain/application/infrastructure
 * directly.
 */
export abstract class CurrentSessionResolver {
  abstract resolve(request: Request): Promise<ResolvedSession | null>;
}
