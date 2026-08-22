import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { StaffListEntry } from '../../domain/entities';
import { StaffDirectoryRepository } from '../../domain/ports/staff-directory.repository';

const SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  role: true,
  status: true,
} as const;

/**
 * Local port implementation (research.md #2): reads the shared `accounts` table's
 * display/identity columns directly via the shared Prisma client, scoped to
 * role IN ('instructor', 'administrador') — never a cross-module dependency on `auth`, since
 * these fields are read-only here.
 */
@Injectable()
export class PrismaStaffDirectoryRepository extends StaffDirectoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(q?: string): Promise<StaffListEntry[]> {
    const where = {
      role: { in: ['instructor', 'administrador'] as ('instructor' | 'administrador')[] },
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: 'insensitive' as const } },
              { apellido: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const rows = await this.prisma.account.findMany({
      where,
      select: SELECT,
      orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
    });

    return rows.map((row) => ({
      accountId: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      role: row.role as StaffListEntry['role'],
      status: row.status as StaffListEntry['status'],
    }));
  }
}
