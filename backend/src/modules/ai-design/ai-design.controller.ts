// src/modules/ai-design/ai-design.controller.ts
import {
    Controller, Post, Body, UploadedFile, UseInterceptors, ParseIntPipe,
    BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiDesignService } from './ai-design.service';

@Controller('ai-design')
export class AiDesignController {
    constructor(private readonly aiDesignService: AiDesignService) { }

    @Post('separate')
    @UseInterceptors(FileInterceptor('image'))
    async separate(
        @UploadedFile() file: Express.Multer.File,
        @Body('num_layers') numLayers: string,
        @Body('prompt') prompt?: string,
    ) {
        // Thêm check file
        if (!file) throw new BadRequestException('Thiếu file ảnh');

        const layersCount = parseInt(numLayers, 10) || 4;
        if (layersCount < 1 || layersCount > 20) throw new BadRequestException('num_layers phải từ 1–20');

        return this.aiDesignService.processLayeredImage(file, layersCount, prompt);
    }
}