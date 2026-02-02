import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as PSD from 'psd';
import * as fs from 'fs-extra';
import * as path from 'path';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Design } from './entities/design.entity';
import { CreateDesignDto } from './dto/create-design.dto';
import { CreateLinkDesignDto } from './dto/create-link-design.dto';
import { DesignOwnerType, LinkDesign } from './entities/design-link.entity';
import { Product } from '../products/entities/product.entity';
import { Variant } from '../products/entities/variant.entity';
import { UpdateDesignDto } from './dto/update-design.dto';
import { UpdateDesignOptionsDto } from './dto/create-design-option.dto';
import { DesignOption } from './entities/design-option.entity';

export interface extractedLayer {
  index: number;
  name: string;
  width: number;
  height: number;
  top: number;
  left: number;
  url: string;
}

@Injectable()
export class DesignsService {
  private readonly logger = new Logger(DesignsService.name);

  constructor(
    @InjectRepository(Design)
    private readonly designRepository: Repository<Design>,
    @InjectRepository(LinkDesign)
    private linkRepo: Repository<LinkDesign>,
    @InjectRepository(Design)
    private designRepo: Repository<Design>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Variant)
    private variantRepo: Repository<Variant>,
    @InjectRepository(DesignOption)
    private optionRepo: Repository<DesignOption>,
  ) {}

  async create(createDesignDto: CreateDesignDto): Promise<Design> {
    const newDesign = this.designRepository.create(createDesignDto);
    return await this.designRepository.save(newDesign);
  }

  async findAll(): Promise<Design[]> {
    return await this.designRepository.find();
  }

  async findOne(id: number): Promise<Design> {
    const design = await this.designRepository.findOne({
      where: { id },
      relations: ['options'],
    });

    if (!design) {
      throw new NotFoundException(`Mẫu thiết kế với ID #${id} không tồn tại`);
    }

    return design;
  }

  async linkDesign(dto: CreateLinkDesignDto) {
    const design = await this.designRepository.findOne({
      where: { id: dto.designId },
    });
    if (!design) throw new NotFoundException('Mẫu thiết kế không tồn tại');

    if (dto.ownerType === DesignOwnerType.PRODUCT) {
      const product = await this.productRepo.findOne({
        where: { id: dto.ownerId },
      });
      if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    } else {
      const variant = await this.variantRepo.findOne({
        where: { id: dto.ownerId },
      });
      if (!variant) throw new NotFoundException('Biến thể không tồn tại');
    }

    const existingLink = await this.linkRepo.findOne({
      where: {
        design: { id: dto.designId },
        ownerType: dto.ownerType,
        ownerId: dto.ownerId,
      },
    });
    if (existingLink) throw new BadRequestException('Liên kết này đã tồn tại');

    const newLink = this.linkRepo.create({
      design,
      ownerType: dto.ownerType,
      ownerId: dto.ownerId,
    });

    return await this.linkRepo.save(newLink);
  }

  async update(id: number, updateDesignDto: UpdateDesignDto): Promise<Design> {
    const design = await this.designRepository.findOne({ where: { id } });

    if (!design) {
      throw new NotFoundException(`Không tìm thấy mẫu thiết kế với ID #${id}`);
    }

    const updatedDesign = this.designRepository.merge(design, updateDesignDto);

    return await this.designRepository.save(updatedDesign);
  }

  async updateDesignOptions(designId: number, dto: UpdateDesignOptionsDto) {
    const design = await this.designRepo.findOne({ where: { id: designId } });
    if (!design) {
      throw new NotFoundException(`Design với ID ${designId} không tồn tại`);
    }

    await this.optionRepo.delete({ design: { id: designId } });

    const newOptions = dto.options.map((optDto) => {
      const option = new DesignOption();
      option.label = optDto.label;
      option.optionType = optDto.optionType;
      option.targetLayerId = optDto.targetLayerId;
      option.config = optDto.config;
      option.design = design;
      return option;
    });

    return await this.optionRepo.save(newOptions);
  }

  async getActiveDesign(productId: number, variantId?: number) {
    let linkedDesign: LinkDesign | null = null;

    // 1. Bước 1: Luôn ưu tiên tìm theo Variant nếu có variantId hợp lệ
    if (variantId && !isNaN(variantId)) {
      linkedDesign = await this.linkRepo.findOne({
        where: {
          ownerType: DesignOwnerType.VARIANT,
          ownerId: variantId,
          isActive: true,
        },
        relations: ['design', 'design.options'],
      });
    }

    // 2. Bước 2: Nếu KHÔNG tìm thấy ở Variant, tìm chính xác ở Product
    // Quan trọng: Phải tìm theo productId gốc mà không quan tâm variantId nữa
    if (!linkedDesign) {
      linkedDesign = await this.linkRepo.findOne({
        where: {
          ownerType: DesignOwnerType.PRODUCT,
          ownerId: productId,
          isActive: true,
        },
        relations: ['design', 'design.options'],
      });
    }

    // 3. Kiểm tra cuối cùng
    if (!linkedDesign || !linkedDesign.design) {
      throw new NotFoundException(
        'Sản phẩm hoặc phiên bản này chưa được cấu hình thiết kế.',
      );
    }

    return linkedDesign.design;
  }
  async extractPsdLayersOnly(fileName: string) {
    if (!fileName) {
      throw new BadRequestException('Tên file không được để trống');
    }

    const rootPath = process.cwd();
    const psdPath = path.resolve(rootPath, 'public/uploads/psd', fileName);
    const outputFolderName = fileName.replace(/\.[^/.]+$/, '');
    const outputDirPath = path.resolve(
      rootPath,
      'public/layers',
      outputFolderName,
    );

    // 1. Kiểm tra file nguồn tồn tại và có dữ liệu
    if (!fs.existsSync(psdPath)) {
      throw new NotFoundException(`Không tìm thấy file PSD tại: ${psdPath}`);
    }

    const stats = fs.statSync(psdPath);
    if (stats.size === 0) {
      throw new BadRequestException('File PSD bị trống (0 bytes)');
    }

    try {
      // 2. Chuẩn bị thư mục đầu ra
      await fs.ensureDir(outputDirPath);
      await fs.emptyDir(outputDirPath);

      // 3. Sử dụng fromFile và parse() thay cho open() để tránh lỗi 'No data provided'
      const psd = PSD.fromFile(psdPath);
      const parsed = psd.parse();

      if (!parsed) {
        throw new Error('Thư viện không thể parse nội dung file PSD');
      }

      const descendants = psd.tree().descendants();
      const result: extractedLayer[] = [];

      this.logger.log(`Đang tách layer cho: ${fileName}...`);

      for (let i = 0; i < descendants.length; i++) {
        const node = descendants[i];

        // 4. Chỉ xử lý các layer đang hiển thị và có kích thước thực tế
        if (
          node.isLayer() &&
          node.visible() &&
          node.width > 0 &&
          node.height > 0
        ) {
          const safeName = node.name.replace(/[/\\?%*:|"<>]/g, '-');
          const layerFileName = `layer-${i}-${safeName}.png`;
          const savePath = path.join(outputDirPath, layerFileName);

          // Lưu layer thành file vật lý
          await node.saveAsPng(savePath);

          result.push({
            index: i,
            name: node.name,
            width: node.width,
            height: node.height,
            top: node.top,
            left: node.left,
            url: `/layers/${outputFolderName}/${layerFileName}`,
          });
        }
      }

      return {
        success: true,
        message: `Đã tách thành công ${result.length} layers`,
        data: result,
      };
    } catch (error) {
      this.logger.error(`Lỗi xử lý PSD [${fileName}]: ${error.message}`);
      throw new Error(`Không thể xử lý file PSD: ${error.message}`);
    }
  }
}
