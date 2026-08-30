import { Inject, Injectable } from '@nestjs/common';
import type { SkateparkDayHours } from '../../domain/entities/skatepark-hours.entity';
import { ClassScheduleRepository } from '../../domain/ports/class-schedule.repository';
import { classesLeftOutside, isValidDayHours } from '../../domain/services/schedule-rules';
import { HoursChangeConflictError, InvalidScheduleInputError } from './errors';

/**
 * FR-016 is the interesting part: a change that would leave classes outside the new range is
 * REJECTED, naming the classes that block it. The system never moves or deletes a class on its own
 * — resolving it is a person's decision.
 */
@Injectable()
export class SetSkateparkDayHoursUseCase {
  constructor(
    @Inject(ClassScheduleRepository) private readonly repository: ClassScheduleRepository,
  ) {}

  async execute(hours: SkateparkDayHours): Promise<SkateparkDayHours> {
    if (!isValidDayHours(hours)) {
      throw new InvalidScheduleInputError(
        'La hora de cierre tiene que ser posterior a la de apertura.',
      );
    }

    return this.repository.setDayHoursChecked(hours, (classesThatDay) => {
      const orphaned = classesLeftOutside(hours, classesThatDay);
      return orphaned.length > 0 ? new HoursChangeConflictError(orphaned) : null;
    });
  }
}
