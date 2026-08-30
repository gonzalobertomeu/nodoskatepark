import { Inject, Injectable } from '@nestjs/common';
import { ClassScheduleRepository } from '../../domain/ports/class-schedule.repository';
import { ScheduledClassNotFoundError } from './errors';

@Injectable()
export class DeleteScheduledClassUseCase {
  constructor(
    @Inject(ClassScheduleRepository) private readonly repository: ClassScheduleRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findClassById(id);
    if (!existing) {
      throw new ScheduledClassNotFoundError('Esa clase no existe.');
    }
    // A real delete. There is no soft delete because the grid keeps no history (FR-025a).
    await this.repository.deleteClass(id);
  }
}
