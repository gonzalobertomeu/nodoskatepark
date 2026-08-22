import type { Request } from 'express';

export interface ResolvedSession {
  accountId: string;
  role: 'skater' | 'instructor' | 'administrador';
}

/**
 * Cross-module port (Constitution II): staff-directory declares this abstraction for what it
 * needs from auth ("who is the current session"), and the auth module provides + exports the
 * concrete implementation. A fourth, independently-declared instance of the same shape 002, 003,
 * and 004 already introduced for their own modules — each consuming module owns its own port.
 */
export abstract class CurrentSessionResolver {
  abstract resolve(request: Request): Promise<ResolvedSession | null>;
}
