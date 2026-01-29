import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class DesignsService {
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
}
