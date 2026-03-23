import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { fal } from "@fal-ai/client";
import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Interface đúng theo schema output
interface FalImageFile {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
    width?: number;
    height?: number;
}

interface FalLayeredResult {
    images: FalImageFile[];
    seed: number;
    prompt?: string;
    timings?: any;
    has_nsfw_concepts?: boolean[];
}

@Injectable()
export class AiDesignService {
    private readonly uploadDir = path.join(process.cwd(), 'public/uploads/layers');

    constructor() {
        fal.config({ credentials: process.env.FAL_KEY });
        fs.ensureDirSync(this.uploadDir);
    }

    async processLayeredImage(file: Express.Multer.File, numLayers: number, prompt?: string) {
        // Validate file đầu vào
        if (!file || !file.buffer) {
            throw new BadRequestException('File ảnh không hợp lệ hoặc bị thiếu');
        }

        try {
            // 1. Upload ảnh lên fal storage → lấy URL public
            // const fileObj = new File([file.buffer], file.originalname, { type: file.mimetype });
            // const imageUrl = await fal.storage.upload(fileObj);
            const arrayBuffer = file.buffer.buffer.slice(
                file.buffer.byteOffset,
                file.buffer.byteOffset + file.buffer.byteLength
            ) as ArrayBuffer;

            const fileObj = new File([arrayBuffer], file.originalname, { type: file.mimetype });
            const imageUrl = await fal.storage.upload(fileObj);
            console.log("Uploaded image URL:", imageUrl);

            // 2. Gọi AI tách lớp
            const result = await fal.subscribe("fal-ai/qwen-image-layered", {
                input: {
                    image_url: imageUrl,
                    prompt: prompt || "Segment the image into separate high-quality transparent layers",
                    num_layers: Number(numLayers),
                    output_format: "png",
                    num_inference_steps: 28,
                    guidance_scale: 5,
                    acceleration: "regular",
                    enable_safety_checker: false,
                },
                pollInterval: 3000,
                logs: true,
                onQueueUpdate: (update: any) => {
                    console.log("Queue status:", update.status);
                    if (update.status === "IN_PROGRESS" && update.logs) {
                        update.logs.forEach((log: any) => console.log("[fal log]", log.message));
                    }
                },
            });

            console.log("FAL RESULT:", JSON.stringify(result, null, 2));

            // result.data chứa output thực tế
            const data = result.data as FalLayeredResult;

            // Validate response đúng cấu trúc
            if (!data?.images || !Array.isArray(data.images) || data.images.length === 0) {
                throw new InternalServerErrorException(
                    `fal.ai không trả về images. Response: ${JSON.stringify(data)}`
                );
            }

            // 3. Download và lưu từng layer về local
            const savedLayers = await Promise.all(
                data.images.map(async (image: FalImageFile, index: number) => {
                    const fileName = `layer-${uuidv4()}.png`;
                    const filePath = path.join(this.uploadDir, fileName);

                    const response = await axios.get(image.url, {
                        responseType: 'arraybuffer',
                        timeout: 30000, // ✅ Timeout 30s tránh treo
                    });
                    await fs.writeFile(filePath, response.data);

                    return {
                        id: index,
                        fileName: fileName,
                        publicUrl: `/uploads/layers/${fileName}`,
                        label: image.file_name || `Layer ${index + 1}`,
                        width: image.width,
                        height: image.height,
                        fileSize: image.file_size,
                    };
                }),
            );

            return {
                message: "Tách lớp thành công",
                originalUrl: imageUrl,
                seed: data.seed,
                totalLayers: savedLayers.length,
                layers: savedLayers,
            };

        } catch (error) {
            console.error("AI Error:", error);
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error; // Re-throw lỗi đã xử lý
            }
            throw new InternalServerErrorException(`Lỗi xử lý AI hoặc lưu file: ${error.message}`);
        }
    }
}