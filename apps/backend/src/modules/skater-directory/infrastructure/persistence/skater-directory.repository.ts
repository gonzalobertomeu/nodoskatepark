import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { SkaterFullProfile } from '../../domain/entities/skater-full-profile.entity';
import type { SkaterListEntry } from '../../domain/entities/skater-list-entry.entity';
import type {
  SaveEditableFieldsInput,
  SearchSkatersInput,
  SearchSkatersResult,
} from '../../domain/ports/skater-directory.repository';
import { SkaterDirectoryRepository } from '../../domain/ports/skater-directory.repository';

const LIST_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  apodo: true,
  fotoPath: true,
  status: true,
} as const;

const PROFILE_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  fechaDeNacimiento: true,
  email: true,
  apodo: true,
  afeccionesDeSalud: true,
  fotoPath: true,
  status: true,
} as const;

/**
 * Owns apodo/afeccionesDeSalud/fotoPath (writes) and reads the full display row — including
 * nombre/apellido/fechaDeNacimiento (skater-profile) and email/status (auth) — directly via the
 * shared Prisma client, per research.md #2. Every query is scoped to `role: 'skater'` so staff
 * accounts never surface through this module.
 */
@Injectable()
export class PrismaSkaterDirectoryRepository extends SkaterDirectoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async search(input: SearchSkatersInput): Promise<SearchSkatersResult> {
    const where = {
      role: 'skater' as const,
      ...(input.q
        ? {
            OR: [
              { nombre: { contains: input.q, mode: 'insensitive' as const } },
              { apellido: { contains: input.q, mode: 'insensitive' as const } },
              { apodo: { contains: input.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        select: LIST_SELECT,
        orderBy: [{ nombre: 'asc' }, { apellido: 'asc' }],
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      this.prisma.account.count({ where }),
    ]);

    const items: SkaterListEntry[] = rows.map((row) => ({
      accountId: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      apodo: row.apodo,
      fotoPath: row.fotoPath,
      status: row.status,
    }));

    return { items, page: input.page, pageSize: input.pageSize, total };
  }

  async findFullProfile(accountId: string): Promise<SkaterFullProfile | null> {
    const row = await this.prisma.account.findFirst({
      where: { id: accountId, role: 'skater' },
      select: PROFILE_SELECT,
    });
    if (!row) {
      return null;
    }
    return {
      accountId: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      fechaDeNacimiento: row.fechaDeNacimiento,
      email: row.email,
      apodo: row.apodo,
      afeccionesDeSalud: row.afeccionesDeSalud,
      fotoPath: row.fotoPath,
      ultimoIngreso: null, // set by the use case via LastCheckInReader, not this repository
      status: row.status,
    };
  }

  async saveEditableFields(input: SaveEditableFieldsInput): Promise<void> {
    await this.prisma.account.update({
      where: { id: input.accountId },
      data: { apodo: input.apodo, afeccionesDeSalud: input.afeccionesDeSalud },
    });
  }

  async saveFotoPath(accountId: string, fotoPath: string): Promise<void> {
    await this.prisma.account.update({ where: { id: accountId }, data: { fotoPath } });
  }
}
