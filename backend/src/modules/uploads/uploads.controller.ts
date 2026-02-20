import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Get,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { UploadsService } from './uploads.service';

@Controller('upload')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, callback) => {
          // 1. Đọc query parameter 'folder' từ URL
          const folderName = req.query.folder === 'assets' ? 'assets' : '';

          // 2. Định tuyến thư mục lưu
          const uploadPath = folderName
            ? `./public/uploads/${folderName}`
            : `./public/uploads`;

          // 3. Tự động tạo thư mục nếu nó chưa tồn tại để tránh lỗi crash app
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          return callback(null, false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: any[],
    @Query('folder') folder: string, // Bắt query param truyền sang service
  ) {
    return this.uploadsService.processUploadedFiles(files, folder);
  }

  @Get('assets')
  getAssets() {
    return this.uploadsService.getAssetImages();
  }
}
