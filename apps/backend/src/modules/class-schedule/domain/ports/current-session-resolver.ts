import type { Request } from 'express';

export interface ResolvedSession {
  accountId: string;
  role: 'skater' | 'instructor' | 'administrador';
}

/**
 * Cross-module port (Principle II): class-schedule declares what it needs from auth ("who is the
 * current session"), and auth provides the concrete implementation. A fifth, independently declared
 * instance of the same shape that 002, 003, 004 and 005 each own for themselves — the point is that
 * no module reaches into another's internals.
 */
export abstract class CurrentSessionResolver {
  abstract resolve(request: Request): Promise<ResolvedSession | null>;
}
