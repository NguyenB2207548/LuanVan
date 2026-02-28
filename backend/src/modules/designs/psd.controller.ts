import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PsdExtractorService } from './psd.service';

@Controller('psd')
export class PsdController {
  constructor(private readonly psdExtractorService: PsdExtractorService) {}

  @Post('extract-psd')
  @HttpCode(HttpStatus.OK)
  async extractPsd(@Body('fileName') fileName: string) {
    if (!fileName) {
      return { message: 'Vui lòng cung cấp tên file (fileName)' };
    }

    const designJson =
      await this.psdExtractorService.extractPsdToJson(fileName);

    return {
      message: 'Trích xuất PSD thành công',
      data: designJson,
    };
  }
}
