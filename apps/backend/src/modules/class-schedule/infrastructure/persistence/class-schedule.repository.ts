import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/persistence/prisma.service';
import type {
  DayOfWeek,
  ScheduledClass,
  ScheduledClassDraft,
} from '../../domain/entities/scheduled-class.entity';
import type { SkateparkDayHours } from '../../domain/entities/skatepark-hours.entity';
import { ClassScheduleRepository } from '../../domain/ports/class-schedule.repository';

type ClassRow = {
  id: string;
  dayOfWeek: string;
  startsAtMinute: number;
  endsAtMinute: number;
  ageGroup: string;
  level: string;
};

type HoursRow = {
  dayOfWeek: string;
  closed: boolean;
  opensAtMinute: number | null;
  closesAtMinute: number | null;
};

function toClass(row: ClassRow): ScheduledClass {
  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek as ScheduledClass['dayOfWeek'],
    startsAtMinute: row.startsAtMinute,
    endsAtMinute: row.endsAtMinute,
    ageGroup: row.ageGroup as ScheduledClass['ageGroup'],
    level: row.level as ScheduledClass['level'],
  };
}

function toHours(row: HoursRow): SkateparkDayHours {
  return {
    dayOfWeek: row.dayOfWeek as DayOfWeek,
    closed: row.closed,
    opensAtMinute: row.opensAtMinute,
    closesAtMinute: row.closesAtMinute,
  };
}

/**
 * The write methods take a `check` callback and run it inside the same transaction as the write.
 * Doing the check in the use case and the write here would leave a window where two administrators
 * could both pass validation and both insert an overlapping class (research.md §5).
 */
@Injectable()
export class PrismaClassScheduleRepository extends ClassScheduleRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listClasses(): Promise<ScheduledClass[]> {
    const rows = await this.prisma.scheduledClass.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { startsAtMinute: 'asc' }],
    });
    return rows.map((row: ClassRow) => toClass(row));
  }

  async listHours(): Promise<SkateparkDayHours[]> {
    const rows = await this.prisma.skateparkHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
    return rows.map((row: HoursRow) => toHours(row));
  }

  async listClassesForDay(dayOfWeek: DayOfWeek): Promise<ScheduledClass[]> {
    const rows = await this.prisma.scheduledClass.findMany({
      where: { dayOfWeek },
      orderBy: { startsAtMinute: 'asc' },
    });
    return rows.map((row: ClassRow) => toClass(row));
  }

  async findClassById(id: string): Promise<ScheduledClass | null> {
    const row = await this.prisma.scheduledClass.findUnique({ where: { id } });
    return row ? toClass(row) : null;
  }

  async createClassChecked(
    draft: ScheduledClassDraft,
    check: (sameDay: ScheduledClass[], hours: SkateparkDayHours | undefined) => Error | null,
  ): Promise<ScheduledClass> {
    return this.prisma.$transaction(async (tx) => {
      const sameDay = await tx.scheduledClass.findMany({ where: { dayOfWeek: draft.dayOfWeek } });
      const hoursRow = await tx.skateparkHours.findUnique({
        where: { dayOfWeek: draft.dayOfWeek },
      });
      const failure = check(
        sameDay.map((row: ClassRow) => toClass(row)),
        hoursRow ? toHours(hoursRow) : undefined,
      );
      if (failure) {
        throw failure;
      }
      const created = await tx.scheduledClass.create({ data: draft });
      return toClass(created);
    });
  }

  async updateClassChecked(
    id: string,
    draft: ScheduledClassDraft,
    check: (sameDay: ScheduledClass[], hours: SkateparkDayHours | undefined) => Error | null,
  ): Promise<ScheduledClass> {
    return this.prisma.$transaction(async (tx) => {
      const sameDay = await tx.scheduledClass.findMany({ where: { dayOfWeek: draft.dayOfWeek } });
      const hoursRow = await tx.skateparkHours.findUnique({
        where: { dayOfWeek: draft.dayOfWeek },
      });
      const failure = check(
        sameDay.map((row: ClassRow) => toClass(row)),
        hoursRow ? toHours(hoursRow) : undefined,
      );
      if (failure) {
        throw failure;
      }
      const updated = await tx.scheduledClass.update({ where: { id }, data: draft });
      return toClass(updated);
    });
  }

  async deleteClass(id: string): Promise<void> {
    // A real delete, not a soft one: the grid keeps no history (FR-025a).
    await this.prisma.scheduledClass.delete({ where: { id } });
  }

  async setDayHoursChecked(
    hours: SkateparkDayHours,
    check: (classesThatDay: ScheduledClass[]) => Error | null,
  ): Promise<SkateparkDayHours> {
    return this.prisma.$transaction(async (tx) => {
      const classesThatDay = await tx.scheduledClass.findMany({
        where: { dayOfWeek: hours.dayOfWeek },
        orderBy: { startsAtMinute: 'asc' },
      });
      const failure = check(classesThatDay.map((row: ClassRow) => toClass(row)));
      if (failure) {
        throw failure;
      }
      const data = {
        closed: hours.closed,
        opensAtMinute: hours.opensAtMinute,
        closesAtMinute: hours.closesAtMinute,
      };
      const saved = await tx.skateparkHours.upsert({
        where: { dayOfWeek: hours.dayOfWeek },
        create: { dayOfWeek: hours.dayOfWeek, ...data },
        update: data,
      });
      return toHours(saved);
    });
  }
}
