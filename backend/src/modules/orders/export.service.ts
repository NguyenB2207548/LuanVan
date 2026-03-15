import { Injectable } from '@nestjs/common';
import { createCanvas, loadImage } from 'canvas';

@Injectable()
export class ExportService {
  /**
   * Render file in chất lượng cao từ JSON Snapshot
   */
  async renderHighResImage(designJson: string, printArea: any) {
    const layers = JSON.parse(designJson);

    // 1. Tính toán kích thước thực tế dựa trên DPI
    // DPI mặc định là 300 nếu không có
    const dpi = printArea.targetDpi || 300;
    const canvasWidth = printArea.realWidthInch * dpi;
    const canvasHeight = printArea.realHeightInch * dpi;

    // 2. Khởi tạo Server-side Canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // 3. Vẽ các lớp (Layers)
    for (const layer of layers) {
      if (layer.type === 'text') {
        ctx.fillStyle = layer.color || '#000000';
        ctx.font = `${layer.fontSize * (dpi / 72)}px ${layer.fontFamily}`; // Scale font theo DPI
        ctx.fillText(
          layer.text,
          layer.x * (canvasWidth / printArea.width),
          layer.y * (canvasHeight / printArea.height),
        );
      } else if (layer.type === 'image') {
        const img = await loadImage(layer.url);
        // Tính toán vị trí tương đối từ Canvas Web sang Canvas In
        const x = (layer.x / printArea.width) * canvasWidth;
        const y = (layer.y / printArea.height) * canvasHeight;
        const w = (layer.width / printArea.width) * canvasWidth;
        const h = (layer.height / printArea.height) * canvasHeight;

        ctx.drawImage(img, x, y, w, h);
      }
    }

    // 4. Xuất ra Buffer (PNG)
    return canvas.toBuffer('image/png');
  }
}
