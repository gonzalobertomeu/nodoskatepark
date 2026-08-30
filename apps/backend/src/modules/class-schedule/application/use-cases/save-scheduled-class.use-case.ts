import { Inject, Injectable } from '@nestjs/common';
import type {
  ScheduledClass,
  ScheduledClassDraft,
} from '../../domain/entities/scheduled-class.entity';
import type { SkateparkDayHours } from '../../domain/entities/skatepark-hours.entity';
import { ClassScheduleRepository } from '../../domain/ports/class-schedule.repository';
import {
  checkAgainstOpeningHours,
  findOverlappingClass,
  isValidRange,
} from '../../domain/services/schedule-rules';
import {
  DayClosedError,
  InvalidScheduleInputError,
  OutsideOpeningHoursError,
  OverlapConflictError,
  ScheduledClassNotFoundError,
} from './errors';

/**
 * Creating and editing share every rule (FR-025), so they share one use case. The only difference
 * is `excludeClassId`, which is what lets an edit not collide with itself.
 *
 * The validation runs inside the repository's transaction, not before calling it: checking here and
 * writing there would leave a window where two administrators both pass and both insert
 * (research.md §5).
 */
@Injectable()
export class SaveScheduledClassUseCase {
  constructor(
    @Inject(ClassScheduleRepository) private readonly repository: ClassScheduleRepository,
  ) {}

  async create(draft: ScheduledClassDraft): Promise<ScheduledClass> {
    this.assertValidRange(draft);
    return this.repository.createClassChecked(draft, (sameDay, hours) =>
      this.check(draft, sameDay, hours),
    );
  }

  async update(id: string, draft: ScheduledClassDraft): Promise<ScheduledClass> {
    this.assertValidRange(draft);
    const existing = await this.repository.findClassById(id);
    if (!existing) {
      throw new ScheduledClassNotFoundError('Esa clase no existe.');
    }
    return this.repository.updateClassChecked(id, draft, (sameDay, hours) =>
      this.check(draft, sameDay, hours, id),
    );
  }

  private assertValidRange(draft: ScheduledClassDraft): void {
    if (!isValidRange(draft.startsAtMinute, draft.endsAtMinute)) {
      throw new InvalidScheduleInputError(
        'La hora de fin tiene que ser posterior a la de inicio, dentro del mismo día.',
      );
    }
  }

  private check(
    draft: ScheduledClassDraft,
    sameDay: ScheduledClass[],
    hours: SkateparkDayHours | undefined,
    excludeClassId?: string,
  ): Error | null {
    const violation = checkAgainstOpeningHours(draft, hours);
    if (violation?.rule === 'day_closed') {
      return new DayClosedError('El skatepark no abre ese día.');
    }
    if (violation?.rule === 'outside_opening_hours') {
      return new OutsideOpeningHoursError(violation.opensAtMinute, violation.closesAtMinute);
    }

    const conflicting = findOverlappingClass(draft, sameDay, excludeClassId);
    if (conflicting) {
      return new OverlapConflictError(conflicting);
    }
    return null;
  }
}
