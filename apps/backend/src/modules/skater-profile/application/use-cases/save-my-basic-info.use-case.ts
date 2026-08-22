import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SkaterProfileErrorCode } from '@nodoskatepark/contracts';
import { isComplete } from '../../domain/entities/skater-basic-info.entity';
import type { SkaterProfileRepository as SkaterProfileRepositoryPort } from '../../domain/ports/skater-profile.repository';
import { SkaterProfileRepository } from '../../domain/ports/skater-profile.repository';
import { SkaterProfileLoggerService } from '../../infrastructure/http/skater-profile-logger.service';

export interface SaveMyBasicInfoInput {
  accountId: string;
  nombre: string;
  apellido: string;
  fechaDeNacimiento: string; // ISO date, as received from the request
}

const MIN_AGE_YEARS = 5;
const MAX_AGE_YEARS = 100;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function invalidInput(message: string): never {
  throw new HttpException(
    { error: SkaterProfileErrorCode.InvalidInput, message },
    HttpStatus.BAD_REQUEST,
  );
}

/**
 * Serves both the onboarding submission (FR-004) and any later self-edit (FR-006) — identical
 * operation, all three fields required together on every call (FR-009, research.md #1). Rejects
 * with 400 invalid_input on any failure, leaving the previous stored value (if any) untouched —
 * there is no partial write.
 */
@Injectable()
export class SaveMyBasicInfoUseCase {
  constructor(
    @Inject(SkaterProfileRepository) private readonly profiles: SkaterProfileRepositoryPort,
    private readonly logger: SkaterProfileLoggerService,
  ) {}

  async execute(input: SaveMyBasicInfoInput): Promise<void> {
    const nombre = input.nombre.trim();
    const apellido = input.apellido.trim();
    if (!nombre) {
      invalidInput('El nombre no puede estar vacío.');
    }
    if (!apellido) {
      invalidInput('El apellido no puede estar vacío.');
    }

    const fechaDeNacimiento = new Date(input.fechaDeNacimiento);
    if (Number.isNaN(fechaDeNacimiento.getTime())) {
      invalidInput('La fecha de nacimiento no es válida.');
    }
    if (fechaDeNacimiento.getTime() > Date.now()) {
      invalidInput('La fecha de nacimiento no puede ser futura.');
    }
    const ageYears = (Date.now() - fechaDeNacimiento.getTime()) / MS_PER_YEAR;
    if (ageYears < MIN_AGE_YEARS || ageYears > MAX_AGE_YEARS) {
      invalidInput('La fecha de nacimiento no corresponde a una edad válida.');
    }

    const before = await this.profiles.findByAccountId(input.accountId);
    const wasComplete = before ? isComplete(before) : false;

    await this.profiles.save({ accountId: input.accountId, nombre, apellido, fechaDeNacimiento });

    this.logger.log(wasComplete ? 'basic_info_updated' : 'basic_info_completed', {
      accountId: input.accountId,
    });
  }
}
