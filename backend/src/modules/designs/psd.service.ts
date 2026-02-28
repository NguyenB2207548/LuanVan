import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { readPsd, initializeCanvas } from 'ag-psd';
import { createCanvas, createImageData } from 'canvas';

// Khởi tạo engine canvas cho ag-psd hoạt động trên Node.js
// initializeCanvas(createCanvas, Image);
initializeCanvas(createCanvas as any, createImageData as any);

@Injectable()
export class PsdExtractorService {
  private readonly psdDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'psd',
  );
  private readonly assetsDir = path.join(
    process.cwd(),
    'public',
    'uploads',
    'assets',
  );

  constructor() {
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
    }
  }

  // Hàm Helper: Lưu layer canvas thành file PNG và trả về URL
  private async saveLayerAsPng(canvas: any, prefix: string): Promise<string> {
    if (!canvas) return '';
    const fileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const filePath = path.join(this.assetsDir, fileName);

    const buffer = canvas.toBuffer('image/png');
    await fs.promises.writeFile(filePath, buffer);

    return `/public/uploads/assets/${fileName}`; // Trả về URL map với tĩnh của backend
  }

  // Hàm Helper: Chuyển đổi mã màu rgba sang HEX
  private rgbaToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()
    );
  }

  // === HÀM CHÍNH ===
  async extractPsdToJson(psdFileName: string) {
    const psdPath = path.join(this.psdDir, psdFileName);

    if (!fs.existsSync(psdPath)) {
      throw new InternalServerErrorException(
        `Không tìm thấy file PSD: ${psdFileName}`,
      );
    }

    try {
      // 1. Đọc file PSD
      const buffer = await fs.promises.readFile(psdPath);
      const psd = readPsd(buffer);

      const templateJson: any = {
        type: 'F',
        background: '',
        details: [],
      };

      let zIndexCounter = psd.children?.length || 100;

      // 2. Lặp qua các Layer (từ dưới lên trên để z-index chuẩn)
      const layers = psd.children ? [...psd.children].reverse() : [];
      for (const layer of layers) {
        // 1. Tạo safeName để chống undefined
        const safeName = layer.name || 'unnamed_layer';
        const layerName = safeName.toLowerCase();
        const id = `layer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Tính toán tọa độ và kích thước
        const x = layer.left || 0;
        const y = layer.top || 0;
        const width = (layer.right || 0) - x;
        const height = (layer.bottom || 0) - y;

        // --- XỬ LÝ BACKGROUND ---
        if (layerName === 'bg' || layerName === 'background') {
          templateJson.background = await this.saveLayerAsPng(
            layer.canvas,
            'bg',
          );
          continue;
        }

        // --- XỬ LÝ STATIC IMAGE ---
        if (layerName.startsWith('static_')) {
          const imageUrl = await this.saveLayerAsPng(layer.canvas, 'static');
          templateJson.details.push({
            id,
            type: 'static_image',
            label: safeName.replace('static_', ''), // SỬA: dùng safeName
            x,
            y,
            width,
            height,
            zIndex: zIndexCounter++,
            image_url: imageUrl,
            show_condition: '',
          });
          continue;
        }

        // --- XỬ LÝ TEXT ---
        if (layerName.startsWith('text_') && layer.text) {
          // Lấy màu (Mặc định đen nếu không lấy được)
          let color = '#000000';

          if (layer.text.style?.fillColor) {
            // SỬA Ở ĐÂY: Lấy object fill ra và ép kiểu as any để dễ xử lý
            const fill = layer.text.style.fillColor as any;

            // Kiểm tra xem hệ màu có phải là RGB không (có tồn tại r, g, b)
            if (
              fill.r !== undefined &&
              fill.g !== undefined &&
              fill.b !== undefined
            ) {
              // Truyền trực tiếp các thuộc tính của object vào hàm
              color = this.rgbaToHex(fill.r, fill.g, fill.b);
            }
          }

          templateJson.details.push({
            id,
            type: 'text',
            label: safeName.replace('text_', ''),
            x,
            y,
            width,
            height,
            zIndex: zIndexCounter++,
            text: layer.text.text || 'Text',
            fontSize: layer.text.style?.fontSize || 24,
            fontFamily: 'Arial',
            color: color,
            show_condition: '',
          });
          continue;
        }

        // --- XỬ LÝ GROUP (DYNAMIC IMAGE) ---
        if (
          (layerName.startsWith('group_') || layerName === 'group') &&
          layer.children
        ) {
          const options: any[] = [];

          // Tạo biến lưu tọa độ tạm thời cho Group
          let groupX = 0;
          let groupY = 0;
          let groupWidth = 60; // Kích thước mặc định nếu lỡ không tính được
          let groupHeight = 60;

          // Cờ đánh dấu đã lấy được tọa độ chưa
          let isBoundsSet = false;

          for (const [index, childLayer] of layer.children.entries()) {
            if (childLayer.hidden) continue;

            // --- THÊM ĐOẠN NÀY ĐỂ LẤY TỌA ĐỘ TỪ LAYER CON ĐẦU TIÊN ---
            if (!isBoundsSet) {
              groupX = childLayer.left || 0;
              groupY = childLayer.top || 0;
              groupWidth = (childLayer.right || 0) - groupX;
              groupHeight = (childLayer.bottom || 0) - groupY;
              isBoundsSet = true;
            }
            // ---------------------------------------------------------

            const optionUrl = await this.saveLayerAsPng(
              childLayer.canvas,
              `opt_${index}`,
            );
            const childSafeName = childLayer.name || `Option ${index + 1}`;

            options.push({
              id: `opt_${Date.now()}_${index}`,
              name: childSafeName,
              image_url: optionUrl,
            });
          }

          let labelName = safeName.startsWith('group_')
            ? safeName.replace('group_', '')
            : 'Options Group';

          templateJson.details.push({
            id,
            type: 'dynamic_image',
            label: labelName,
            // SỬA: Thay x, y, width, height bằng các biến vừa tính được
            x: groupX,
            y: groupY,
            width: groupWidth > 0 ? groupWidth : 60,
            height: groupHeight > 0 ? groupHeight : 60,
            zIndex: zIndexCounter++,
            options: options,
            image_url: options.length > 0 ? options[0].image_url : '',
            show_condition: '',
          });
          continue;
        }
      }

      return templateJson;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Lỗi khi bóc tách file PSD');
    }
  }
}
