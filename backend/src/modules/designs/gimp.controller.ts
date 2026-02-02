// src/gimp/gimp.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GimpService } from './gimp.service';
import { ExportLayersDto } from './dto/export-layers.dto';

@Controller('gimps')
export class GimpController {
  constructor(private readonly gimpService: GimpService) {}

  @Post('export-layers')
  @HttpCode(HttpStatus.OK)
  async exportLayers(@Body() exportLayersDto: ExportLayersDto) {
    return await this.gimpService.exportLayers(
      exportLayersDto.psdFileName,
      exportLayersDto.outputFolderName,
    );
  }

  //   @Get('psd-files')
  //   async listPsdFiles() {
  //     const files = await this.gimpService.listPsdFiles();
  //     return {
  //       success: true,
  //       total: files.length,
  //       files,
  //     };
  //   }

  //   @Get('exported-layers/:folderName')
  //   async listExportedLayers(@Param('folderName') folderName: string) {
  //     const files = await this.gimpService.listExportedLayers(folderName);
  //     return {
  //       success: true,
  //       total: files.length,
  //       folder: folderName,
  //       files,
  //     };
  //   }
}
