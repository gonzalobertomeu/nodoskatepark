import { Inject, Injectable } from '@nestjs/common';
import type { ScheduledClass } from '../../domain/entities/scheduled-class.entity';
import type { SkateparkDayHours } from '../../domain/entities/skatepark-hours.entity';
import { ClassScheduleRepository } from '../../domain/ports/class-schedule.repository';

/**
 * The whole section in one read: the screen shows the grid and the hours together, and a class
 * cannot be validated against anything without the hours (research.md §6).
 */
@Injectable()
export class GetClassScheduleUseCase {
  constructor(
    @Inject(ClassScheduleRepository) private readonly repository: ClassScheduleRepository,
  ) {}

  async execute(): Promise<{ classes: ScheduledClass[]; hours: SkateparkDayHours[] }> {
    const [classes, hours] = await Promise.all([
      this.repository.listClasses(),
      this.repository.listHours(),
    ]);
    return { classes, hours };
  }
}
