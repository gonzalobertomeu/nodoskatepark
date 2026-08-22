import { Inject, Injectable } from '@nestjs/common';
import { isComplete } from '../../domain/entities/skater-basic-info.entity';
import type { SkaterProfileRepository as SkaterProfileRepositoryPort } from '../../domain/ports/skater-profile.repository';
import { SkaterProfileRepository } from '../../domain/ports/skater-profile.repository';

export interface MyBasicInfoResult {
  nombre: string | null;
  apellido: string | null;
  fechaDeNacimiento: Date | null;
  complete: boolean;
}

/** User Story 1 (gate check) and User Story 2 (profile view). */
@Injectable()
export class GetMyBasicInfoUseCase {
  constructor(
    @Inject(SkaterProfileRepository) private readonly profiles: SkaterProfileRepositoryPort,
  ) {}

  async execute(accountId: string): Promise<MyBasicInfoResult> {
    const info = await this.profiles.findByAccountId(accountId);
    const nombre = info?.nombre ?? null;
    const apellido = info?.apellido ?? null;
    const fechaDeNacimiento = info?.fechaDeNacimiento ?? null;
    return {
      nombre,
      apellido,
      fechaDeNacimiento,
      complete: isComplete({ nombre, apellido, fechaDeNacimiento }),
    };
  }
}
