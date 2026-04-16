import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { readPsd, initializeCanvas } from 'ag-psd';
import { createCanvas, createImageData } from 'canvas';

initializeCanvas(createCanvas as any, createImageData as any);

@Injectable()
export class PsdService {
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

  // Đổi thành 800 để scale các tọa độ layer khớp với Canvas Size mới
  private readonly TARGET_CANVAS_WIDTH = 800;

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
      throw new InternalServerErrorException(
        `Không tìm thấy file PSD: ${psdFileName}`,
      );
    }

    try {
      const buffer = await fs.promises.readFile(psdPath);
      const psd = readPsd(buffer);

      const originalPsdWidth = psd.width;
      const ratio = this.TARGET_CANVAS_WIDTH / originalPsdWidth;

      // Cấu trúc trả về mới: Chỉ chứa chi tiết layer và canvasSize
      const resultJson: any = {
        details: [],
        canvasSize: {
          width: 800,
          height: 800,
        },
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

        // ÁP DỤNG SCALE CHO TỪNG LAYER
        const x = Math.round(rawX * ratio);
        const y = Math.round(rawY * ratio);
        const width = Math.round(rawWidth * ratio);
        const height = Math.round(rawHeight * ratio);

        // --- 1. XỬ LÝ STATIC IMAGE ---
        if (layerName.startsWith('static_')) {
          const imageUrl = await this.saveLayerAsPng(layer.canvas, 'static');
          resultJson.details.push({
            id,
            type: 'static_image',
            label: safeName.replace('static_', ''),
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

        // --- 2. XỬ LÝ UPLOAD (ẢNH KHÁCH HÀNG TẢI LÊN) ---
        if (layerName.startsWith('upload_')) {
          const imageUrl = await this.saveLayerAsPng(layer.canvas, 'upload');
          resultJson.details.push({
            id,
            type: 'upload',
            label: safeName.replace('upload_', ''),
            x,
            y,
            width,
            height,
            zIndex: zIndexCounter++,
            image_url: imageUrl,
          });
          continue;
        }

        // --- 3. XỬ LÝ TEXT (Đã loại bỏ dynamictext) ---
        if (layerName.startsWith('text_') && layer.text) {
          let color = '#000000';
          if (layer.text.style?.fillColor) {
            const fill = layer.text.style.fillColor as any;
            if (fill.r !== undefined)
              color = this.rgbaToHex(fill.r, fill.g, fill.b);
          }

          resultJson.details.push({
            id,
            type: 'text',
            label: safeName.replace('text_', ''),
            x,
            y,
            width,
            height,
            zIndex: zIndexCounter++,
            text: layer.text.text || 'Text',
            fontSize: Math.round((layer.text.style?.fontSize || 24) * ratio),
            fontFamily: 'Arial',
            color: color,
            show_condition: '',
          });
          continue;
        }

        // --- 4. XỬ LÝ GROUP THÀNH DYNAMIC IMAGE ---
        if (
          (layerName.startsWith('group_') || layerName === 'group') &&
          layer.children
        ) {
          const options: any[] = [];

          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
          const validChildren = layer.children.filter((child) => !child.hidden);

          for (const childLayer of validChildren) {
            minX = Math.min(minX, childLayer.left ?? 0);
            minY = Math.min(minY, childLayer.top ?? 0);
            maxX = Math.max(maxX, childLayer.right ?? 0);
            maxY = Math.max(maxY, childLayer.bottom ?? 0);
          }

          if (minX === Infinity) continue;

          for (const [index, childLayer] of validChildren.entries()) {
            const optionUrl = await this.saveLayerAsPng(
              childLayer.canvas,
              `opt_${index}`,
            );
            options.push({
              id: `opt_${Date.now()}_${index}`,
              name: childLayer.name || `Option ${index + 1}`,
              image_url: optionUrl,
            });
          }

          const groupWidth = (maxX - minX) * ratio;
          const groupHeight = (maxY - minY) * ratio;

          resultJson.details.push({
            id,
            type: 'dynamic_image',
            label: safeName.startsWith('group_')
              ? safeName.replace('group_', '')
              : 'Choose Option',
            x: Math.round(minX * ratio),
            y: Math.round(minY * ratio),
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
