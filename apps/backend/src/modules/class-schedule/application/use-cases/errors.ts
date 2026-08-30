import type { ScheduledClass } from '../../domain/entities/scheduled-class.entity';

/**
 * Domain failures the controller maps to contract error codes. They carry data, not just a message:
 * FR-022 requires telling the person what to fix and FR-016 requires naming the classes that block
 * a change.
 */
export class InvalidScheduleInputError extends Error {}

export class OverlapConflictError extends Error {
  constructor(readonly conflictingClass: ScheduledClass) {
    super('La clase se solapa con otra del mismo día.');
  }
}

export class DayClosedError extends Error {}

export class OutsideOpeningHoursError extends Error {
  constructor(
    readonly opensAtMinute: number,
    readonly closesAtMinute: number,
  ) {
    super('La clase queda fuera del horario del skatepark para ese día.');
  }
}

export class HoursChangeConflictError extends Error {
  constructor(readonly conflictingClasses: ScheduledClass[]) {
    super('El cambio dejaría clases fuera del horario del skatepark.');
  }
}

export class ScheduledClassNotFoundError extends Error {}
