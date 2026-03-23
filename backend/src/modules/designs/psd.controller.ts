import { Controller, Post, Body, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PsdService } from './psd.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer'; // Import từ multer
import { extname } from 'path';

@Controller('psd')
export class PsdController {
  constructor(private readonly psdService: PsdService) { }

  // @Post('extract')
  // @HttpCode(HttpStatus.OK)
  // async extractPsd(@Body('fileName') fileName: string) {
  //   if (!fileName) {
  //     return { message: 'Vui lòng cung cấp tên file (fileName)' };
  //   }

  //   const designJson =
  //     await this.psdExtractorService.extractPsdToJson(fileName);

  //   return {
  //     message: 'Trích xuất PSD thành công',
  //     data: designJson,
  //   };
  // }

  @Post('extract')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './public/uploads/psd',
      filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    })
  }))
  async uploadAndExtract(@UploadedFile() file: Express.Multer.File) {
    // Sau khi file đã nằm trong thư mục psd, ta mới gọi hàm extract
    return this.psdService.extractPsdToJson(file.filename);
  }
}
