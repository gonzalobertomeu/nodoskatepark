import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  type ListSkatersResponse,
  type OkResponse,
  SkaterDirectoryErrorCode,
  type SkaterFullProfileResponse,
  type UpdateSkaterEditableFieldsRequest,
  type UploadSkaterPhotoResponse,
  updateSkaterEditableFieldsRequestSchema,
} from '@nodoskatepark/contracts';
import type { Response } from 'express';
import { GetSkaterProfileUseCase } from '../../application/use-cases/get-skater-profile.use-case';
import { ListSkatersUseCase } from '../../application/use-cases/list-skaters.use-case';
import { UpdateSkaterEditableFieldsUseCase } from '../../application/use-cases/update-skater-editable-fields.use-case';
import { UploadSkaterPhotoUseCase } from '../../application/use-cases/upload-skater-photo.use-case';
import { InvalidPhotoError, PhotoStorage } from '../../domain/ports/photo-storage';
import { type StaffRequest, StaffSessionGuard } from './staff-session.guard';

@Controller('skater-directory')
@UseGuards(StaffSessionGuard)
export class SkaterDirectoryController {
  constructor(
    private readonly listSkaters: ListSkatersUseCase,
    private readonly getSkaterProfile: GetSkaterProfileUseCase,
    private readonly updateSkaterEditableFields: UpdateSkaterEditableFieldsUseCase,
    private readonly uploadSkaterPhoto: UploadSkaterPhotoUseCase,
    private readonly photoStorage: PhotoStorage,
  ) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<ListSkatersResponse> {
    const result = await this.listSkaters.execute({
      q,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    return result;
  }

  @Get(':accountId')
  async getProfile(@Param('accountId') accountId: string): Promise<SkaterFullProfileResponse> {
    const profile = await this.getSkaterProfile.execute(accountId);
    if (!profile) {
      throw new HttpException(
        { error: SkaterDirectoryErrorCode.NotFound, message: 'Skater no encontrado.' },
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      accountId: profile.accountId,
      nombre: profile.nombre,
      apellido: profile.apellido,
      fechaDeNacimiento: profile.fechaDeNacimiento ? profile.fechaDeNacimiento.toISOString() : null,
      email: profile.email,
      apodo: profile.apodo,
      afeccionesDeSalud: profile.afeccionesDeSalud,
      fotoPath: profile.fotoPath,
      ultimoIngreso: profile.ultimoIngreso ? profile.ultimoIngreso.toISOString() : null,
      status: profile.status,
    };
  }

  @Put(':accountId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Req() request: StaffRequest,
    @Param('accountId') accountId: string,
    @Body() body: UpdateSkaterEditableFieldsRequest,
  ): Promise<OkResponse> {
    const input = updateSkaterEditableFieldsRequestSchema.parse(body);
    await this.updateSkaterEditableFields.execute({
      accountId,
      editedByAccountId: request.staffAccountId as string,
      apodo: input.apodo,
      afeccionesDeSalud: input.afeccionesDeSalud,
    });
    return { status: 'ok' };
  }

  @Post(':accountId/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @Param('accountId') accountId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadSkaterPhotoResponse> {
    if (!file) {
      throw new HttpException(
        { error: SkaterDirectoryErrorCode.InvalidInput, message: 'No se recibió ningún archivo.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const fotoPath = await this.uploadSkaterPhoto.execute({
        accountId,
        photo: { buffer: file.buffer, mimeType: file.mimetype, sizeBytes: file.size },
      });
      return { status: 'ok', fotoPath };
    } catch (error) {
      if (error instanceof InvalidPhotoError) {
        throw new HttpException(
          { error: SkaterDirectoryErrorCode.InvalidInput, message: error.message },
          HttpStatus.BAD_REQUEST,
        );
      }
      throw error;
    }
  }

  @Get(':accountId/photo')
  async getPhoto(@Param('accountId') accountId: string, @Res() response: Response): Promise<void> {
    const profile = await this.getSkaterProfile.execute(accountId);
    if (!profile?.fotoPath) {
      throw new HttpException(
        { error: SkaterDirectoryErrorCode.NotFound, message: 'No hay foto para este skater.' },
        HttpStatus.NOT_FOUND,
      );
    }
    const photo = await this.photoStorage.read(profile.fotoPath);
    if (!photo) {
      throw new HttpException(
        { error: SkaterDirectoryErrorCode.NotFound, message: 'No hay foto para este skater.' },
        HttpStatus.NOT_FOUND,
      );
    }
    response.contentType(photo.mimeType).send(photo.buffer);
  }
}
