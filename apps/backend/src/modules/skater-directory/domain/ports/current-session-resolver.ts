import type { Request } from 'express';

export interface ResolvedSession {
  accountId: string;
  role: 'skater' | 'instructor' | 'administrador';
}

/**
 * Cross-module port (Constitution II): skater-directory declares this abstraction for what it
 * needs from auth ("who is the current session"), and the auth module provides + exports the
 * concrete implementation. Mirrors the same-shaped port skater-profile (004) already declared
 * for itself — each consuming module owns its own port, per Constitution II, rather than reusing
 * another module's.
 */
export abstract class CurrentSessionResolver {
  abstract resolve(request: Request): Promise<ResolvedSession | null>;
}
