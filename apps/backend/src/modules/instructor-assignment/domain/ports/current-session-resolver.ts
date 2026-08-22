import type { Request } from 'express';

export interface ResolvedSession {
  accountId: string;
  role: 'skater' | 'instructor' | 'administrador';
}

/**
 * Cross-module port (Constitution II): instructor-assignment declares this abstraction for what
 * it needs from auth ("who is the current session"), and the auth module provides + exports the
 * concrete implementation. A third, independently-declared instance of the same shape 004 and
 * 002 already introduced for their own modules — each consuming module owns its own port.
 */
export abstract class CurrentSessionResolver {
  abstract resolve(request: Request): Promise<ResolvedSession | null>;
}
