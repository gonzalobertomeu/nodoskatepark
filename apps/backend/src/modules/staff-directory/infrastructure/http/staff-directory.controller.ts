import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { ListStaffResponse } from '@nodoskatepark/contracts';
import { ListStaffUseCase } from '../../application/use-cases/list-staff.use-case';
import { StaffDirectoryAdminOnlyGuard } from './staff-directory-admin-only.guard';

@Controller('staff-directory')
@UseGuards(StaffDirectoryAdminOnlyGuard)
export class StaffDirectoryController {
  constructor(private readonly listStaff: ListStaffUseCase) {}

  @Get()
  async list(@Query('q') q?: string): Promise<ListStaffResponse> {
    const items = await this.listStaff.execute(q);
    return { items };
  }
}
