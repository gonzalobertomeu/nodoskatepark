import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type { SkaterBasicInfo } from '../../domain/entities/skater-basic-info.entity';
import type { SaveBasicInfoInput } from '../../domain/ports/skater-profile.repository';
import { SkaterProfileRepository } from '../../domain/ports/skater-profile.repository';

const SELECT = { id: true, nombre: true, apellido: true, fechaDeNacimiento: true } as const;

/**
 * Reads/writes only the three basic-info columns on the shared `accounts` table (data-model.md)
 * — never touches any other Account field, keeping this module's persistence footprint narrow
 * even though it shares a physical table with the `auth` module.
 */
@Injectable()
export class PrismaSkaterProfileRepository extends SkaterProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByAccountId(accountId: string): Promise<SkaterBasicInfo | null> {
    const row = await this.prisma.account.findUnique({ where: { id: accountId }, select: SELECT });
    if (!row) {
      return null;
    }
    return {
      accountId: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      fechaDeNacimiento: row.fechaDeNacimiento,
    };
  }

  async save(input: SaveBasicInfoInput): Promise<SkaterBasicInfo> {
    const row = await this.prisma.account.update({
      where: { id: input.accountId },
      data: {
        nombre: input.nombre,
        apellido: input.apellido,
        fechaDeNacimiento: input.fechaDeNacimiento,
      },
      select: SELECT,
    });
    return {
      accountId: row.id,
      nombre: row.nombre,
      apellido: row.apellido,
      fechaDeNacimiento: row.fechaDeNacimiento,
    };
  }
}
