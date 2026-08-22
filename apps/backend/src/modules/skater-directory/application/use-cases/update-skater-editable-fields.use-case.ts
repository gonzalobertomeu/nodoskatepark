import { Inject, Injectable } from '@nestjs/common';
import { HealthAuditRepository } from '../../domain/ports/health-audit.repository';
import { SkaterDirectoryRepository } from '../../domain/ports/skater-directory.repository';
import { SkaterDirectoryLoggerService } from '../../infrastructure/http/skater-directory-logger.service';

export interface UpdateSkaterEditableFieldsInput {
  accountId: string;
  editedByAccountId: string;
  apodo: string | null;
  afeccionesDeSalud: string | null;
}

/**
 * User Story 3: apodo + afecciones de salud only (FR-009, FR-011). Appends a
 * SkaterHealthAuditLog row on every call, since afeccionesDeSalud is always part of this
 * write — including clearing it to null (FR-014, Edge Cases).
 */
@Injectable()
export class UpdateSkaterEditableFieldsUseCase {
  constructor(
    @Inject(SkaterDirectoryRepository) private readonly directory: SkaterDirectoryRepository,
    @Inject(HealthAuditRepository) private readonly healthAudit: HealthAuditRepository,
    private readonly logger: SkaterDirectoryLoggerService,
  ) {}

  async execute(input: UpdateSkaterEditableFieldsInput): Promise<void> {
    await this.directory.saveEditableFields({
      accountId: input.accountId,
      apodo: input.apodo,
      afeccionesDeSalud: input.afeccionesDeSalud,
    });
    await this.healthAudit.append({
      skaterAccountId: input.accountId,
      editedByAccountId: input.editedByAccountId,
    });
    this.logger.log('editable_fields_updated', {
      accountId: input.accountId,
      editedByAccountId: input.editedByAccountId,
    });
  }
}
