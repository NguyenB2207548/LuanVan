import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  processUploadedFiles(files: any[], folder?: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Không có file nào được tải lên');
    }

    // Nếu có query folder=assets, thì chèn thêm '/assets' vào URL trả về
    const basePath =
      folder === 'assets' ? '/public/uploads/assets' : '/public/uploads';

    // Map mảng file trả về mảng URL
    const urls = files.map((file) => `${basePath}/${file.filename}`);

    return { urls };
  }

  getAssetImages() {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'assets');

    try {
      // Kiểm tra xem thư mục có tồn tại không
      if (!fs.existsSync(uploadDir)) {
        return { data: [] };
      }

      // Đọc toàn bộ file trong thư mục
      const files = fs.readdirSync(uploadDir);

      // Lọc ra các file ảnh và lấy thông tin thời gian tạo để sắp xếp
      const images = files
        .filter((file) => file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) // Chỉ lấy file ảnh
        .map((file) => {
          const filePath = path.join(uploadDir, file);
          const stat = fs.statSync(filePath);

          return {
            url: `/public/uploads/assets/${file}`,
            time: stat.mtime.getTime(),
          };
        })
        .sort((a, b) => b.time - a.time) // Sắp xếp giảm dần: Ảnh mới nhất lên đầu tiên
        .map((item) => item.url); // Map lại để chỉ trả về mảng URL

      return { data: images };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Lỗi khi đọc thư mục chứa ảnh');
    }
  }
}
