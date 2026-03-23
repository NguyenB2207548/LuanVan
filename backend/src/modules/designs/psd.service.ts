import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { readPsd, initializeCanvas } from 'ag-psd';
import { createCanvas, createImageData } from 'canvas';

initializeCanvas(createCanvas as any, createImageData as any);

@Injectable()
export class PsdService {
  private readonly psdDir = path.join(process.cwd(), 'public', 'uploads', 'psd');
  private readonly assetsDir = path.join(process.cwd(), 'public', 'uploads', 'assets');

  // Kích thước chuẩn của khung thiết kế trên Web (khớp với Frontend)
  private readonly TARGET_CANVAS_WIDTH = 650;

  constructor() {
    if (!fs.existsSync(this.assetsDir)) {
      fs.mkdirSync(this.assetsDir, { recursive: true });
    }
  }

  private async saveLayerAsPng(canvas: any, prefix: string): Promise<string> {
    if (!canvas) return '';
    const fileName = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const filePath = path.join(this.assetsDir, fileName);
    const buffer = canvas.toBuffer('image/png');
    await fs.promises.writeFile(filePath, buffer);
    return `/public/uploads/assets/${fileName}`;
  }

  private rgbaToHex(r: number, g: number, b: number): string {
    return (
      '#' +
      ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()
    );
  }

  async extractPsdToJson(psdFileName: string) {
    const psdPath = path.join(this.psdDir, psdFileName);

    if (!fs.existsSync(psdPath)) {
      throw new InternalServerErrorException(`Không tìm thấy file PSD: ${psdFileName}`);
    }

    try {
      const buffer = await fs.promises.readFile(psdPath);
      const psd = readPsd(buffer);

      const originalPsdWidth = psd.width;
      console.log(originalPsdWidth)

      const ratio = this.TARGET_CANVAS_WIDTH / originalPsdWidth;

      const printAreaScale = 0.8;
      const pw = originalPsdWidth * printAreaScale;
      const ph = psd.height * printAreaScale;

      const resultJson: any = {
        mockup: "",
        details: [],
        printArea: {
          x: Math.round(((originalPsdWidth - pw) / 2) * ratio),
          y: Math.round(((psd.height - ph) / 2) * ratio),
          width: Math.round(pw * ratio),
          height: Math.round(ph * ratio),
          visible: true
        }
      };

      const layers = psd.children ? [...psd.children].reverse() : [];
      let zIndexCounter = 0;

      for (const layer of layers) {
        const safeName = layer.name || 'unnamed_layer';
        const layerName = safeName.toLowerCase();
        const id = `layer_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Tọa độ gốc từ PSD
        const rawX = layer.left || 0;
        const rawY = layer.top || 0;
        const rawWidth = (layer.right || 0) - rawX;
        const rawHeight = (layer.bottom || 0) - rawY;

        // --- ÁP DỤNG SCALE CHO TỪNG LAYER ---
        const x = Math.round(rawX * ratio);
        const y = Math.round(rawY * ratio);
        const width = Math.round(rawWidth * ratio);
        const height = Math.round(rawHeight * ratio);
        // --- XỬ LÝ MOCKUP ---

        const isMockupLayer =
          layerName === 'mockup' ||
          layerName === 'background' ||
          layerName.startsWith('background_') ||
          layerName.startsWith('bg_');

        if (isMockupLayer) {
          const fullCanvas = createCanvas(psd.width, psd.height);
          const ctx = fullCanvas.getContext('2d');

          if (layer.canvas) {
            ctx.drawImage(layer.canvas as any, layer.left || 0, layer.top || 0);
            resultJson.mockup = await this.saveLayerAsPng(fullCanvas, 'mockup');
          } else {
            console.warn(`[PSD] Layer ${safeName} được đánh dấu là mockup nhưng không có dữ liệu hình ảnh.`);
          }

          continue;
        }
        // --- XỬ LÝ STATIC IMAGE ---
        if (layerName.startsWith('static_')) {
          const imageUrl = await this.saveLayerAsPng(layer.canvas, 'static');
          resultJson.details.push({
            x, y, id,
            type: 'static_image',
            label: safeName.replace('static_', ''),
            width, height,
            zIndex: zIndexCounter++,
            image_url: imageUrl,
          });
          continue;
        }

        // --- XỬ LÝ TEXT ---
        if (layerName.startsWith('text_') && layer.text) {
          let color = '#000000';
          if (layer.text.style?.fillColor) {
            const fill = layer.text.style.fillColor as any;
            if (fill.r !== undefined) color = this.rgbaToHex(fill.r, fill.g, fill.b);
          }

          resultJson.details.push({
            x, y, id,
            type: 'text',
            label: safeName.replace('text_', ''),
            width, height,
            zIndex: zIndexCounter++,
            text: layer.text.text || 'Text',
            // Font size cũng cần scale theo tỉ lệ
            fontSize: Math.round((layer.text.style?.fontSize || 24) * ratio),
            fontFamily: 'Arial',
            color: color,
          });
          continue;
        }
        // --- XỬ LÝ GROUP (DYNAMIC IMAGE) ---
        if ((layerName.startsWith('group_') || layerName === 'group') && layer.children) {
          const options: any[] = [];

          // 1. Tìm bounding box chuẩn xác của tất cả layer con
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

          // Lọc các layer con hợp lệ (không ẩn và có dữ liệu)
          const validChildren = layer.children.filter(child => !child.hidden);

          for (const childLayer of validChildren) {
            minX = Math.min(minX, childLayer.left ?? 0);
            minY = Math.min(minY, childLayer.top ?? 0);
            maxX = Math.max(maxX, childLayer.right ?? 0);
            maxY = Math.max(maxY, childLayer.bottom ?? 0);
          }

          // Nếu không có layer con hợp lệ, bỏ qua
          if (minX === Infinity) continue;

          for (const [index, childLayer] of validChildren.entries()) {
            // Lưu ý: Chúng ta lưu layer con thành PNG. 
            // Đảm bảo canvas được trích xuất đúng kích thước vùng chứa của nó.
            const optionUrl = await this.saveLayerAsPng(childLayer.canvas, `opt_${index}`);

            options.push({
              id: `opt_${Date.now()}_${index}`,
              name: childLayer.name || `Option ${index + 1}`,
              image_url: optionUrl,
            });
          }

          // 2. Scale tọa độ Group theo tỉ lệ Canvas Web
          const groupWidth = (maxX - minX) * ratio;
          const groupHeight = (maxY - minY) * ratio;

          resultJson.details.push({
            // Quan trọng: Phải dùng Math.floor hoặc Math.round đồng nhất
            x: Math.round(minX * ratio),
            y: Math.round(minY * ratio),
            id,
            type: 'dynamic_image',
            label: safeName.startsWith('group_') ? safeName.replace('group_', '') : 'Choose Option',
            width: Math.round(groupWidth),
            height: Math.round(groupHeight),
            zIndex: zIndexCounter++,
            options: options,
            image_url: options.length > 0 ? options[0].image_url : '',
          });
          continue;
        }
      }

      return resultJson;
    } catch (error) {
      console.error('Psd Error:', error);
      throw new InternalServerErrorException('Lỗi khi bóc tách file PSD');
    }
  }
}