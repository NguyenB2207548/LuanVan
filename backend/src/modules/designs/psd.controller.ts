import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PsdService } from './psd.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'; // Import từ multer
import { extname } from 'path';

@Controller('psd')
export class PsdController {
  constructor(private readonly psdService: PsdService) {}

  @Post('extract')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public/uploads/psd',
        filename: (req, file, cb) =>
          cb(null, `${Date.now()}-${file.originalname}`),
      }),
    }),
  )
  async uploadAndExtract(@UploadedFile() file: Express.Multer.File) {
    return this.psdService.extractPsdToJson(file.filename);
  }
}
