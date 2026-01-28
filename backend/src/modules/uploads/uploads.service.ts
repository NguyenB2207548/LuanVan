import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class UploadsService {
  processUploadedFiles(files: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    // Map mảng file trả về mảng URL
    const urls = files.map((file) => `/public/uploads/${file.filename}`);

    return { urls };
  }
}
