import type { SkaterBasicInfo } from '../entities/skater-basic-info.entity';

export interface SaveBasicInfoInput {
  accountId: string;
  nombre: string;
  apellido: string;
  fechaDeNacimiento: Date;
}

export abstract class SkaterProfileRepository {
  abstract findByAccountId(accountId: string): Promise<SkaterBasicInfo | null>;
  abstract save(input: SaveBasicInfoInput): Promise<SkaterBasicInfo>;
}
