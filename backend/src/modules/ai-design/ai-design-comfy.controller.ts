import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiDesignComfyService } from './ai-design-comfy.service';

@Controller('ai-design/comfy')
export class AiDesignComfyController {
  constructor(private readonly aiDesignComfyService: AiDesignComfyService) {}

  @Post('separate')
  @UseInterceptors(FileInterceptor('image'))
  async separate(
    @UploadedFile() file: Express.Multer.File,
    @Body('num_layers') numLayers: string,
    @Body('prompt') prompt?: string,
  ) {
    if (!file) throw new BadRequestException('Thiếu file ảnh');

    const layersCount = parseInt(numLayers, 10) || 4;
    if (layersCount < 1 || layersCount > 20) {
      throw new BadRequestException('num_layers phải từ 1–20');
    }

    return this.aiDesignComfyService.processLayeredImage(
      file,
      layersCount,
      prompt || '',
    );
  }
}
