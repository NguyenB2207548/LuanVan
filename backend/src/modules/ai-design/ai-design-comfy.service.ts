import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AiDesignComfyService {
  private readonly comfyUrl =
    process.env.COMFYUI_URL ||
    'https://handbags-philip-vpn-mounted.trycloudflare.com';
  private readonly uploadDir = path.join(
    process.cwd(),
    'public/uploads/layers',
  );

  constructor() {
    fs.ensureDirSync(this.uploadDir);
  }

  async processLayeredImage(
    file: Express.Multer.File,
    numLayers: number,
    promptText: string,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('File ảnh không hợp lệ hoặc bị thiếu');
    }

    try {
      const imageName = await this.uploadImage(file);
      const promptId = await this.queuePrompt(imageName, numLayers, promptText);
      const outputFilenames = await this.pollForResults(promptId);

      const savedLayers = await Promise.all(
        outputFilenames.map(async (filename: string, index: number) => {
          const localFileName = `layer-${uuidv4()}.png`;
          const filePath = path.join(this.uploadDir, localFileName);
          const fileUrl = `${this.comfyUrl}/view?filename=${filename}&type=output`;

          const response = await axios.get(fileUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
          });

          const buffer = Buffer.from(response.data);
          await fs.writeFile(filePath, buffer);

          return {
            id: index,
            fileName: localFileName,
            publicUrl: `/public/uploads/layers/${localFileName}`,
            label: `Layer ${index + 1}`,
            fileSize: buffer.byteLength,
          };
        }),
      );

      return {
        message: 'Tách lớp thành công',
        originalUrl: `${this.comfyUrl}/view?filename=${imageName}&type=input`,
        promptId: promptId,
        totalLayers: savedLayers.length,
        layers: savedLayers,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi xử lý API');
    }
  }

  private async uploadImage(file: Express.Multer.File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file.buffer, { filename: file.originalname });

    const response = await axios.post(
      `${this.comfyUrl}/upload/image`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    return response.data.name;
  }

  private async queuePrompt(
    imageName: string,
    numLayers: number,
    promptText: string,
  ): Promise<string> {
    const workflow = require('./Qwen.json');

    workflow['85']['inputs']['image'] = imageName;
    workflow['84:6']['inputs']['text'] = promptText;
    workflow['84:83']['inputs']['layers'] = numLayers;
    workflow['84:3']['inputs']['seed'] = Math.floor(
      Math.random() * 1000000000000000,
    );

    const response = await axios.post(`${this.comfyUrl}/prompt`, {
      prompt: workflow,
    });

    return response.data.prompt_id;
  }

  private async pollForResults(promptId: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(
            `${this.comfyUrl}/history/${promptId}`,
          );
          const history = response.data[promptId];

          if (history && history.outputs) {
            clearInterval(interval);
            const outputs = history.outputs;
            let filenames: string[] = [];

            for (const nodeId in outputs) {
              if (outputs[nodeId].images) {
                filenames = filenames.concat(
                  outputs[nodeId].images.map((img: any) => img.filename),
                );
              }
            }
            resolve(filenames);
          } else if (
            history &&
            history.status &&
            history.status.status_str === 'error'
          ) {
            clearInterval(interval);
            reject(new Error('Lỗi render'));
          }
        } catch (error) {}
      }, 5000);
    });
  }
}
