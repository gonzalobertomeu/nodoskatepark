import { Body, Controller, Get, HttpCode, HttpStatus, Put, Req, UseGuards } from '@nestjs/common';
import {
  type OkResponse,
  type SaveSkaterBasicInfoRequest,
  type SkaterBasicInfoResponse,
  saveSkaterBasicInfoRequestSchema,
} from '@nodoskatepark/contracts';
import { GetMyBasicInfoUseCase } from '../../application/use-cases/get-my-basic-info.use-case';
import { SaveMyBasicInfoUseCase } from '../../application/use-cases/save-my-basic-info.use-case';
import { type SkaterRequest, SkaterSessionGuard } from './skater-session.guard';

@Controller('skater-profile')
@UseGuards(SkaterSessionGuard)
export class SkaterProfileController {
  constructor(
    private readonly getMyBasicInfo: GetMyBasicInfoUseCase,
    private readonly saveMyBasicInfo: SaveMyBasicInfoUseCase,
  ) {}

  @Get('me')
  async getMe(@Req() request: SkaterRequest): Promise<SkaterBasicInfoResponse> {
    const accountId = request.skaterAccountId as string;
    const result = await this.getMyBasicInfo.execute(accountId);
    return {
      nombre: result.nombre,
      apellido: result.apellido,
      fechaDeNacimiento: result.fechaDeNacimiento ? result.fechaDeNacimiento.toISOString() : null,
      complete: result.complete,
    };
  }

  @Put('me')
  @HttpCode(HttpStatus.OK)
  async saveMe(
    @Req() request: SkaterRequest,
    @Body() body: SaveSkaterBasicInfoRequest,
  ): Promise<OkResponse> {
    const accountId = request.skaterAccountId as string;
    const input = saveSkaterBasicInfoRequestSchema.parse(body);
    await this.saveMyBasicInfo.execute({ accountId, ...input });
    return { status: 'ok' };
  }
}
